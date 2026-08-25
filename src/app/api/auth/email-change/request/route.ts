import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createHash,
  randomInt,
} from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

/* =========================
   HELPERS
========================= */

function hashSessionToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashOtp(otp: string) {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

/* =========================
   SEND OTP EMAIL
========================= */

async function sendEmailChangeOtp(
  email: string,
  firstName: string,
  otp: string
) {
  const apiKey =
    process.env.BREVO_API_KEY;

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL;

  const senderName =
    process.env.BREVO_SENDER_NAME ||
    "CyberLearn";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo environment variables are missing."
    );
  }

  const brevoResponse =
    await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept:
            "application/json",
          "api-key": apiKey,
          "content-type":
            "application/json",
        },

        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },

          to: [
            {
              email,
              name: firstName,
            },
          ],

          subject:
            "Verify your CyberLearn email change",

          htmlContent: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 30px;
              color: #172019;
            ">

              <h2>
                Verify your email change
              </h2>

              <p>
                Hi ${firstName},
              </p>

              <p>
                We received a request to change
                the email address associated with
                your CyberLearn account.
              </p>

              <p>
                Enter the verification code below
                to confirm that you are the owner
                of this account.
              </p>

              <div style="
                margin: 30px 0;
                padding: 20px;
                text-align: center;
                background: #f1fff6;
                border: 1px solid #b7e8c9;
              ">

                <div style="
                  font-size: 32px;
                  font-weight: 700;
                  letter-spacing: 8px;
                ">
                  ${otp}
                </div>

              </div>

              <p>
                This code will expire in
                <strong>10 minutes</strong>.
              </p>

              <p>
                If you did not request an email
                change, you can safely ignore
                this email.
              </p>

              <hr style="
                border: 0;
                border-top: 1px solid #ddd;
                margin: 30px 0;
              " />

              <p style="
                color: #68736c;
                font-size: 12px;
              ">
                CyberLearn
              </p>

            </div>
          `,
        }),
      }
    );

  if (!brevoResponse.ok) {
    const error =
      await brevoResponse.text();

    console.error(
      "Brevo email-change OTP error:",
      error
    );

    throw new Error(
      "Brevo email sending failed."
    );
  }
}

/* =========================
   GET AUTHENTICATED USER
========================= */

async function getAuthenticatedUser() {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash =
    hashSessionToken(
      sessionToken
    );

  const session =
    await prisma.session.findFirst({
      where: {
        tokenHash,

        expiresAt: {
          gt: new Date(),
        },
      },

      include: {
        user: true,
      },
    });

  if (!session) {
    return null;
  }

  return session.user;
}

/* =========================
   POST
========================= */

export async function POST(
  request: Request
) {
  try {
    /* =========================
       AUTHENTICATION
    ========================= */

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message:
            "You must be logged in to change your email.",
        },
        { status: 401 }
      );
    }

    /* =========================
       REQUEST BODY
    ========================= */

    const body =
      await request.json();

    const newEmail =
      typeof body.newEmail ===
      "string"
        ? body.newEmail
            .trim()
            .toLowerCase()
        : "";

    /* =========================
       VALIDATE EMAIL
    ========================= */

    if (!newEmail) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_EMAIL",
          message:
            "New email address is required.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        newEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_EMAIL",
          message:
            "Your email is incorrect.",
        },
        { status: 400 }
      );
    }

    /* =========================
       SAME EMAIL CHECK
    ========================= */

    if (
      newEmail ===
      user.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "SAME_EMAIL",
          message:
            "The new email must be different from your current email.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CHECK EMAIL AVAILABILITY
    ========================= */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: newEmail,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_ALREADY_IN_USE",
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    /* =========================
       FIND EXISTING REQUEST
    ========================= */

    const existingRequest =
      await prisma.emailChangeVerification.findFirst(
        {
          where: {
            userId: user.id,
          },
        }
      );

    const now = new Date();

    /*
     * Email-change request starts
     * with a fresh OTP.
     *
     * OTP request rate limiting
     * will be implemented separately
     * for resend/new request handling.
     */

    const otp =
      randomInt(
        100000,
        1000000
      ).toString();

    const otpHash =
      hashOtp(otp);

    const otpExpiresAt =
      new Date(
        now.getTime() +
          10 * 60 * 1000
      );

    /* =========================
       SAVE REQUEST
    ========================= */

    if (existingRequest) {
      await prisma.emailChangeVerification.update(
        {
          where: {
            id: existingRequest.id,
          },

          data: {
            currentEmail:
              user.email,

            newEmail,

            otpHash,

            otpExpiresAt,

            otpAttempts: 0,

            /*
             * New request invalidates
             * any previous new-email
             * verification token.
             */
            verificationTokenHash:
              null,

            verificationTokenExpiresAt:
              null,

            newEmailVerified:
              false,
          },
        }
      );
    } else {
      await prisma.emailChangeVerification.create(
        {
          data: {
            userId: user.id,

            currentEmail:
              user.email,

            newEmail,

            otpHash,

            otpExpiresAt,

            otpAttempts: 0,

            verificationTokenHash:
              null,

            verificationTokenExpiresAt:
              null,

            newEmailVerified:
              false,

            verificationRequestCount:
              0,

            verificationRequestWindowStart:
              null,
          },
        }
      );
    }

    /* =========================
       SEND OTP
    ========================= */

    try {
      await sendEmailChangeOtp(
        user.email,
        user.firstName,
        otp
      );
    } catch (error) {
      console.error(
        "Email-change OTP sending failed:",
        error
      );

      /*
       * Remove the pending request
       * if the email could not be sent.
       */
      await prisma.emailChangeVerification.deleteMany(
        {
          where: {
            userId: user.id,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_SEND_FAILED",
          message:
            "Unable to send verification email. Please try again.",
        },
        { status: 502 }
      );
    }

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json(
      {
        success: true,
        code:
          "CURRENT_EMAIL_OTP_SENT",

        message:
          "A verification code has been sent to your current email address.",

        email:
          user.email,

        expiresInSeconds:
          10 * 60,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Email-change request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "EMAIL_CHANGE_REQUEST_ERROR",
        message:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}