import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

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
            "You must be logged in to verify your email change.",
        },
        { status: 401 }
      );
    }

    /* =========================
       REQUEST BODY
    ========================= */

    const body =
      await request.json();

    const otp =
      typeof body.otp === "string"
        ? body.otp.trim()
        : "";

    /* =========================
       OTP REQUIRED
    ========================= */

    if (!otp) {
      return NextResponse.json(
        {
          success: false,
          code: "OTP_REQUIRED",
          message:
            "Verification code is required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       OTP FORMAT
    ========================= */

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_OTP_FORMAT",
          message:
            "OTP must be a 6-digit code.",
        },
        { status: 400 }
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
            "No email change verification request was found. Please request a new verification code.",
        },
        { status: 404 }
      );
    }

    /* =========================
       CURRENT EMAIL CHECK
    ========================= */

    if (
      emailChangeRequest.currentEmail !==
      user.email
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "EMAIL_CHANGE_STATE_INVALID",
          message:
            "This email change request is no longer valid. Please start again.",
        },
        { status: 409 }
      );
    }

    /* =========================
       ALREADY VERIFIED CHECK
    ========================= */

    if (
      emailChangeRequest.newEmailVerified
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "CURRENT_EMAIL_ALREADY_VERIFIED",
          message:
            "The current email has already been verified for this request.",
        },
        { status: 409 }
      );
    }

    /* =========================
       MAXIMUM ATTEMPTS CHECK
    ========================= */

    if (
      emailChangeRequest.otpAttempts >= 5
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "OTP_ATTEMPTS_EXCEEDED",
          attemptsLeft: 0,
          message:
            "You have used all 5 attempts. Please request a new verification code.",
        },
        { status: 429 }
      );
    }

    /* =========================
       OTP EXPIRY
    ========================= */

    if (
      new Date() >
      emailChangeRequest.otpExpiresAt
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "OTP_EXPIRED",
          message:
            "This verification code has expired. Please request a new code.",
        },
        { status: 410 }
      );
    }

    /* =========================
       HASH SUBMITTED OTP
    ========================= */

    const submittedOtpHash =
      hashOtp(otp);

    /* =========================
       VERIFY OTP
    ========================= */

    if (
      submittedOtpHash !==
      emailChangeRequest.otpHash
    ) {
      const newAttemptCount =
        emailChangeRequest.otpAttempts +
        1;

      /* =========================
         5TH WRONG ATTEMPT
      ========================= */

      if (newAttemptCount >= 5) {
        await prisma.emailChangeVerification.update(
          {
            where: {
              id:
                emailChangeRequest.id,
            },

            data: {
              otpHash: "",
              otpExpiresAt:
                new Date(),

              otpAttempts:
                newAttemptCount,

              verificationTokenHash:
                null,

              verificationTokenExpiresAt:
                null,

              newEmailVerified:
                false,
            },
          }
        );

        return NextResponse.json(
          {
            success: false,
            code:
              "OTP_ATTEMPTS_EXCEEDED",
            attemptsLeft: 0,
            message:
              "Incorrect OTP. You have used all 5 attempts. Please request a new verification code.",
          },
          { status: 429 }
        );
      }

      /* =========================
         RECORD WRONG ATTEMPT
      ========================= */

      await prisma.emailChangeVerification.update(
        {
          where: {
            id:
              emailChangeRequest.id,
          },

          data: {
            otpAttempts:
              newAttemptCount,
          },
        }
      );

      const attemptsLeft =
        5 - newAttemptCount;

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_OTP",
          attemptsLeft,

          message:
            `Incorrect OTP. ${attemptsLeft} attempt${
              attemptsLeft === 1
                ? ""
                : "s"
            } remaining.`,
        },
        { status: 400 }
      );
    }

    /* =========================
       OTP CORRECT
    ========================= */

    /*
     * Mark the current-email
     * verification as successful.
     *
     * IMPORTANT:
     * User.email is NOT changed here.
     *
     * The new email must still be
     * verified separately.
     */

    await prisma.emailChangeVerification.update(
      {
        where: {
          id:
            emailChangeRequest.id,
        },

        data: {
          otpHash: "",

          otpExpiresAt:
            new Date(),

          otpAttempts:
            emailChangeRequest.otpAttempts,

          newEmailVerified:
            true,
        },
      }
    );

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json(
      {
        success: true,

        code:
          "CURRENT_EMAIL_VERIFIED",

        message:
          "Current email verified successfully. The new email can now be verified.",

        currentEmail:
          user.email,

        newEmail:
          emailChangeRequest.newEmail,
      },

      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Current email OTP verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "CURRENT_EMAIL_VERIFICATION_ERROR",
        message:
          "Something went wrong while verifying the code.",
      },
      { status: 500 }
    );
  }
}