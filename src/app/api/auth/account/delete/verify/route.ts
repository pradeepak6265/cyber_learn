import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

const MAX_OTP_ATTEMPTS = 5;

function hashOtp(otp: string) {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

export async function POST(
  request: Request
) {
  try {
    const user =
      await requireUser();

    /* =========================
       READ REQUEST
    ========================= */

    const body =
      await request.json();

    const otp =
      typeof body.otp === "string"
        ? body.otp.trim()
        : "";

    /* =========================
       OTP FORMAT
    ========================= */

    if (
      !/^\d{6}$/.test(otp)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_OTP",
          message:
            "Please enter the 6-digit verification code.",
        },
        { status: 400 }
      );
    }

    /* =========================
       FIND DELETE VERIFICATION
    ========================= */

    const verification =
      await prisma.accountDeletionVerification.findFirst(
        {
          where: {
            userId: user.id,
          },

          orderBy: {
            createdAt: "desc",
          },
        }
      );

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          code:
            "DELETE_VERIFICATION_NOT_FOUND",
          message:
            "No active account deletion verification was found. Please request a new code.",
        },
        { status: 400 }
      );
    }

    /* =========================
       ATTEMPT LIMIT
    ========================= */

    if (
      verification.otpAttempts >=
      MAX_OTP_ATTEMPTS
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "OTP_ATTEMPTS_EXCEEDED",
          message:
            "Too many incorrect attempts. Please request a new verification code.",
        },
        { status: 429 }
      );
    }

    /* =========================
       EXPIRY CHECK
    ========================= */

    if (
      verification.otpExpiresAt <=
      new Date()
    ) {
      await prisma.accountDeletionVerification.delete(
        {
          where: {
            id:
              verification.id,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          code: "OTP_EXPIRED",
          message:
            "This verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    /* =========================
       VERIFY OTP
    ========================= */

    const submittedOtpHash =
      hashOtp(otp);

    if (
      submittedOtpHash !==
      verification.otpHash
    ) {
      const updatedAttempts =
        verification.otpAttempts +
        1;

      await prisma.accountDeletionVerification.update(
        {
          where: {
            id:
              verification.id,
          },

          data: {
            otpAttempts:
              updatedAttempts,
          },
        }
      );

      const attemptsRemaining =
        Math.max(
          0,
          MAX_OTP_ATTEMPTS -
            updatedAttempts
        );

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_OTP",
          message:
            attemptsRemaining > 0
              ? `Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`
              : "Too many incorrect attempts. Please request a new verification code.",
        },
        { status: 400 }
      );
    }

    /* =========================
       DELETE ACCOUNT
    ========================= */

    await prisma.$transaction(
      async (tx) => {
        /*
         * Delete the deletion verification
         * record first.
         */
        await tx.accountDeletionVerification.deleteMany(
          {
            where: {
              userId:
                user.id,
            },
          }
        );

        /*
         * Explicitly remove existing
         * user-related authentication data.
         *
         * These are also protected by
         * onDelete: Cascade, but explicit
         * deletion keeps this operation
         * clear and deterministic.
         */
        await tx.session.deleteMany({
          where: {
            userId:
              user.id,
          },
        });

        await tx.passwordResetToken.deleteMany(
          {
            where: {
              userId:
                user.id,
            },
          }
        );

        await tx.emailChangeVerification.deleteMany(
          {
            where: {
              userId:
                user.id,
            },
          }
        );

        /*
         * Finally delete the user.
         *
         * Any future User relations using
         * onDelete: Cascade will also be
         * removed automatically.
         */
        await tx.user.delete({
          where: {
            id:
              user.id,
          },
        });
      }
    );

    /* =========================
       SUCCESS RESPONSE
    ========================= */

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Your CyberLearn account has been permanently deleted.",
        },
        { status: 200 }
      );

    /* =========================
       CLEAR AUTH COOKIE
    ========================= */

    response.cookies.set({
      name:
        SESSION_COOKIE_NAME,

      value: "",

      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Account deletion verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "ACCOUNT_DELETE_VERIFY_ERROR",
        message:
          "Something went wrong while deleting your account.",
      },
      { status: 500 }
    );
  }
}