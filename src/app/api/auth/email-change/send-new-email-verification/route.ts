import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

const TOKEN_EXPIRY_MINUTES = 30;

const RATE_LIMIT_HOURS = 3;

const MAX_VERIFICATION_EMAILS = 3;

/* =========================
   HELPERS
========================= */

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashVerificationToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/* =========================
   AUTHENTICATED USER
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
   SEND VERIFICATION EMAIL
========================= */

async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
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

  /*
   * IMPORTANT:
   *
   * Keep the base URL in an environment
   * variable instead of hard-coding localhost.
   */
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const verificationUrl =
    `${appUrl}/verify-email-change?token=${encodeURIComponent(
      verificationToken
    )}`;

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
            "Confirm your new CyberLearn email",

          htmlContent: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 30px;
              color: #172019;
            ">

              <h2>
                Confirm your new email
              </h2>

              <p>
                Hi ${firstName},
              </p>

              <p>
                Your current email has been
                successfully verified for an
                email-change request.
              </p>

              <p>
                To complete the change, confirm
                ownership of this new email
                address by clicking the button
                below.
              </p>

              <div style="
                margin: 30px 0;
                text-align: center;
              ">

                <a
                  href="${verificationUrl}"
                  style="
                    display: inline-block;
                    padding: 13px 22px;
                    background: #172019;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 7px;
                    font-weight: 600;
                  "
                >
                  Confirm Email
                </a>

              </div>

              <p style="
                color: #68736c;
                font-size: 13px;
              ">
                This verification link will
                expire in
                <strong>
                  ${TOKEN_EXPIRY_MINUTES} minutes
                </strong>.
              </p>

              <p style="
                color: #68736c;
                font-size: 13px;
              ">
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
      "Brevo new-email verification error:",
      error
    );

    throw new Error(
      "Brevo email sending failed."
    );
  }
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
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    /* =========================
       FIND EMAIL CHANGE REQUEST
    ========================= */

    const emailChangeRequest =
      await prisma.emailChangeVerification.findFirst(
        {
          where: {
            userId: user.id,
          },
        }
      );

    if (!emailChangeRequest) {
      return NextResponse.json(
        {
          success: false,
          code:
            "EMAIL_CHANGE_NOT_FOUND",
          message:
            "No email change request was found. Please start the email change process again.",
        },
        { status: 404 }
      );
    }

    /* =========================
       CURRENT EMAIL MUST
       ALREADY BE VERIFIED
    ========================= */

    if (
      !emailChangeRequest.newEmailVerified
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "CURRENT_EMAIL_NOT_VERIFIED",
          message:
            "Please verify your current email before continuing.",
        },
        { status: 403 }
      );
    }

    /* =========================
       CHECK NEW EMAIL
       ========================= */

    const newEmail =
      emailChangeRequest.newEmail
        .trim()
        .toLowerCase();

    if (!newEmail) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_NEW_EMAIL",
          message:
            "The new email address is invalid.",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure the email has not
     * been claimed by another account
     * since the original request.
     */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: newEmail,
        },
      });

    if (
      existingUser &&
      existingUser.id !== user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "EMAIL_ALREADY_IN_USE",
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    /* =========================
       RATE LIMIT
       3 EMAILS / 3 HOURS
    ========================= */

    const now = new Date();

    let requestCount =
      emailChangeRequest
        .verificationRequestCount;

    let windowStart =
      emailChangeRequest
        .verificationRequestWindowStart;

    const windowDuration =
      RATE_LIMIT_HOURS *
      60 *
      60 *
      1000;

    /*
     * Start a new 3-hour window
     * if there is no window or the
     * previous window has expired.
     */

    if (
      !windowStart ||
      now.getTime() -
        windowStart.getTime() >=
        windowDuration
    ) {
      requestCount = 0;
      windowStart = now;
    }

    /* =========================
       RATE LIMIT EXCEEDED
    ========================= */

    if (
      requestCount >=
      MAX_VERIFICATION_EMAILS
    ) {
      const retryAt =
        new Date(
          windowStart.getTime() +
            windowDuration
        );

      const retryAfterSeconds =
        Math.max(
          1,
          Math.ceil(
            (retryAt.getTime() -
              now.getTime()) /
              1000
          )
        );

      return NextResponse.json(
        {
          success: false,
          code:
            "VERIFICATION_RATE_LIMITED",

          message:
            "You have reached the maximum of 3 verification emails within 3 hours.",

          retryAfterSeconds,
        },

        {
          status: 429,

          headers: {
            "Retry-After":
              retryAfterSeconds.toString(),
          },
        }
      );
    }

    /* =========================
       GENERATE TOKEN
    ========================= */

    const verificationToken =
      randomBytes(32).toString("hex");

    const verificationTokenHash =
      hashVerificationToken(
        verificationToken
      );

    const verificationTokenExpiresAt =
      new Date(
        now.getTime() +
          TOKEN_EXPIRY_MINUTES *
            60 *
            1000
      );

    const newRequestCount =
      requestCount + 1;

    /* =========================
       SAVE TOKEN
    ========================= */

    await prisma.emailChangeVerification.update(
      {
        where: {
          id:
            emailChangeRequest.id,
        },

        data: {
          verificationTokenHash,

          verificationTokenExpiresAt,

          verificationRequestCount:
            newRequestCount,

          verificationRequestWindowStart:
            windowStart,
        },
      }
    );

    /* =========================
       SEND EMAIL
    ========================= */

    try {
      await sendVerificationEmail(
        newEmail,
        user.firstName,
        verificationToken
      );
    } catch (error) {
      console.error(
        "New-email verification send failed:",
        error
      );

      /*
       * Invalidate the token that
       * could not be delivered.
       *
       * Keep the request counter.
       * A failed delivery still counts
       * toward the anti-abuse limit.
       */

      await prisma.emailChangeVerification.update(
        {
          where: {
            id:
              emailChangeRequest.id,
          },

          data: {
            verificationTokenHash:
              null,

            verificationTokenExpiresAt:
              null,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          code:
            "EMAIL_SEND_FAILED",
          message:
            "Unable to send the confirmation email. Please try again later.",
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
          "NEW_EMAIL_VERIFICATION_SENT",

        message:
          "A confirmation email has been sent to your new email address.",

        email: newEmail,

        expiresInSeconds:
          TOKEN_EXPIRY_MINUTES *
          60,

        verificationEmailsRemaining:
          MAX_VERIFICATION_EMAILS -
          newRequestCount,
      },

      { status: 200 }
    );
  } catch (error) {
    console.error(
      "New-email verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "NEW_EMAIL_VERIFICATION_ERROR",
        message:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}