import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 10;

function hashOtp(otp: string) {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

function generateOtp() {
  return randomInt(
    100000,
    1000000
  ).toString();
}

export async function POST() {
  try {
    const user = await requireUser();

    /* =========================
       GET CURRENT USER
    ========================= */

    const databaseUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
        },
      });

    if (!databaseUser) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message:
            "Your account could not be found.",
        },
        { status: 404 }
      );
    }

    /* =========================
       GENERATE OTP
    ========================= */

    const otp = generateOtp();

    const otpHash = hashOtp(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES *
            60 *
            1000
      );

    /* =========================
       REMOVE OLD DELETE OTP
    ========================= */

    await prisma.accountDeletionVerification.deleteMany(
      {
        where: {
          userId:
            databaseUser.id,
        },
      }
    );

    /* =========================
       STORE NEW OTP
    ========================= */

    await prisma.accountDeletionVerification.create(
      {
        data: {
          userId:
            databaseUser.id,

          otpHash,

          otpExpiresAt,

          otpAttempts: 0,
        },
      }
    );

    /* =========================
       BREVO CONFIGURATION
    ========================= */

    const apiKey =
      process.env.BREVO_API_KEY;

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL;

    const senderName =
      process.env.BREVO_SENDER_NAME ||
      "CyberLearn";

    if (
      !apiKey ||
      !senderEmail
    ) {
      throw new Error(
        "Brevo email configuration is not configured."
      );
    }

    /* =========================
       SEND OTP EMAIL
    ========================= */

    const emailResponse =
      await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "api-key":
              apiKey,
          },

          body: JSON.stringify({
            sender: {
              email:
                senderEmail,

              name:
                senderName,
            },

            to: [
              {
                email:
                  databaseUser.email,

                name:
                  databaseUser.firstName,
              },
            ],

            subject:
              "CyberLearn account deletion verification code",

            htmlContent: `
              <div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #172019;
              ">

                <h2>
                  Delete your CyberLearn account
                </h2>

                <p>
                  We received a request to permanently
                  delete your CyberLearn account.
                </p>

                <p>
                  Your verification code is:
                </p>

                <div style="
                  font-size: 32px;
                  font-weight: 700;
                  letter-spacing: 8px;
                  margin: 20px 0;
                ">
                  ${otp}
                </div>

                <p>
                  This code expires in
                  ${OTP_EXPIRY_MINUTES} minutes.
                </p>

                <p>
                  If you did not request account deletion,
                  do not enter this code.
                </p>

                <p>
                  CyberLearn
                </p>

              </div>
            `,
          }),

          cache: "no-store",
        }
      );

    /* =========================
       EMAIL FAILURE
    ========================= */

    if (!emailResponse.ok) {
      const errorText =
        await emailResponse.text();

      console.error(
        "Account deletion email failed:",
        errorText
      );

      /*
       * Remove the stored OTP if
       * the email could not be sent.
       */
      await prisma.accountDeletionVerification.deleteMany(
        {
          where: {
            userId:
              databaseUser.id,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          code:
            "EMAIL_SEND_FAILED",
          message:
            "Unable to send the account deletion verification code.",
        },
        { status: 500 }
      );
    }

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json(
      {
        success: true,

        message:
          "A verification code has been sent to your email.",

        expiresIn:
          OTP_EXPIRY_MINUTES *
          60,
      },

      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Account deletion request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "ACCOUNT_DELETE_REQUEST_ERROR",
        message:
          "Something went wrong while requesting account deletion.",
      },
      { status: 500 }
    );
  }
}