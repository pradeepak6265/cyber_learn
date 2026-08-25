import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function hashOtp(otp: string) {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sendOtpEmail(
  email: string,
  firstName: string,
  surname: string,
  otp: string
) {
  const apiKey = process.env.BREVO_API_KEY;
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

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email,
            name: `${firstName} ${surname}`,
          },
        ],

        subject:
          "Your new CyberLearn verification code",

        htmlContent: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            color: #172019;
          ">

            <h2>
              Your new CyberLearn verification code
            </h2>

            <p>
              Hi ${firstName},
            </p>

            <p>
              Your previous verification code is
              no longer valid.
            </p>

            <p>
              Use this new code to verify your
              CyberLearn account:
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
              If you did not request this code,
              you can safely ignore this email.
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

  if (!response.ok) {
    const error = await response.text();

    console.error(
      "Brevo resend OTP error:",
      error
    );

    throw new Error(
      "Unable to send OTP email."
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CHECK PENDING SIGNUP
    ========================= */

    const pendingSignup =
      await prisma.pendingSignup.findFirst({
        where: {
          email,
        },
      });

    if (!pendingSignup) {
      return NextResponse.json(
        {
          success: false,
          code: "VERIFICATION_NOT_FOUND",
          message:
            "Verification request not found. Please signup again.",
        },
        { status: 404 }
      );
    }

    const now = new Date();

    let requestCount =
      pendingSignup.otpRequestCount;

    let windowStart =
      pendingSignup.otpRequestWindowStart;

    /* =========================
       ONE HOUR RATE LIMIT
    ========================= */

    if (
      windowStart &&
      now.getTime() -
        windowStart.getTime() <
        60 * 60 * 1000
    ) {
      if (requestCount >= 5) {
        const retryAt =
          windowStart.getTime() +
          60 * 60 * 1000;

        const minutesRemaining =
          Math.max(
            1,
            Math.ceil(
              (retryAt -
                now.getTime()) /
                (60 * 1000)
            )
          );

        return NextResponse.json(
          {
            success: false,
            code: "OTP_RATE_LIMITED",
            message:
              `You have reached the maximum OTP request limit. ` +
              `Please try again in approximately ` +
              `${minutesRemaining} minute${
                minutesRemaining === 1
                  ? ""
                  : "s"
              }.`,
          },
          { status: 429 }
        );
      }
    } else {
      /*
       * Previous one-hour window expired.
       * Start a new window.
       */
      requestCount = 0;
      windowStart = now;
    }

    /* =========================
       GENERATE NEW OTP
    ========================= */

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

    const newRequestCount =
      requestCount + 1;

    /* =========================
       UPDATE PENDING SIGNUP
       
       IMPORTANT:
       New otpHash immediately
       invalidates previous OTP.
    ========================= */

    await prisma.pendingSignup.update({
      where: {
        id: pendingSignup.id,
      },

      data: {
        otpHash,
        otpExpiresAt,

        /*
         * New OTP gets 5 fresh
         * verification attempts.
         */
        otpAttempts: 0,

        /*
         * Request limit remains
         * separate.
         */
        otpRequestCount:
          newRequestCount,

        otpRequestWindowStart:
          windowStart,
      },
    });

    /* =========================
       SEND EMAIL
    ========================= */

    try {
      await sendOtpEmail(
        email,
        pendingSignup.firstName,
        pendingSignup.surname,
        otp
      );
    } catch (error) {
      console.error(
        "Resend OTP email failed:",
        error
      );

      /*
       * We already replaced the OTP.
       * Remove pending signup so the user
       * cannot get stuck with an unusable
       * verification request.
       */
      await prisma.pendingSignup.delete({
        where: {
          id: pendingSignup.id,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send verification email. Please signup again.",
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

        message:
          "A new verification code has been sent.",

        requestsUsed:
          newRequestCount,

        requestsRemaining:
          5 - newRequestCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Resend OTP API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}