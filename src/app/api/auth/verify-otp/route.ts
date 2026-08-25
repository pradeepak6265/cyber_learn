import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* =========================
   HELPERS
========================= */

function hashOtp(otp: string) {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

function hashVerificationToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/* =========================
   POST
========================= */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const otp =
      typeof body.otp === "string"
        ? body.otp.trim()
        : "";

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email and OTP are required.",
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
          message:
            "OTP must be a 6-digit code.",
        },
        { status: 400 }
      );
    }

    /* =========================
       READ VERIFICATION COOKIE
    ========================= */

    const cookieStore = await cookies();

    const verificationToken =
      cookieStore.get(
        "cyberlearn_verification"
      )?.value;

    /*
     * The verification access token is
     * required in addition to the OTP.
     *
     * The OTP alone must never be enough
     * to complete account verification.
     */

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          code: "VERIFICATION_ACCESS_DENIED",
          message:
            "Verification session is invalid. Please start signup again.",
        },
        { status: 401 }
      );
    }

    /* =========================
       HASH VERIFICATION TOKEN
    ========================= */

    const verificationTokenHash =
      hashVerificationToken(
        verificationToken
      );

    /* =========================
       FIND PENDING SIGNUP
       USING TOKEN
    ========================= */

    const pendingSignup =
      await prisma.pendingSignup.findFirst({
        where: {
          verificationTokenHash,
        },
      });

    /*
     * Token is missing, invalid,
     * already replaced, or already
     * invalidated.
     */

    if (!pendingSignup) {
      const response =
        NextResponse.json(
          {
            success: false,
            code:
              "VERIFICATION_ACCESS_DENIED",
            message:
              "Verification session is invalid. Please start signup again.",
          },
          { status: 401 }
        );

      response.cookies.delete(
        "cyberlearn_verification"
      );

      return response;
    }

    /* =========================
       VERIFY TOKEN EXPIRY
    ========================= */

    if (
      !pendingSignup.verificationTokenExpiresAt ||
      new Date() >
        pendingSignup.verificationTokenExpiresAt
    ) {
      await prisma.pendingSignup.delete({
        where: {
          id: pendingSignup.id,
        },
      });

      const response =
        NextResponse.json(
          {
            success: false,
            code: "VERIFICATION_EXPIRED",
            message:
              "Your verification session has expired. Please start signup again.",
          },
          { status: 410 }
        );

      response.cookies.delete(
        "cyberlearn_verification"
      );

      return response;
    }

    /* =========================
       EMAIL MUST MATCH TOKEN
    ========================= */

    /*
     * Do not trust an email supplied by
     * the client unless it matches the
     * server-side verification state.
     */

    if (
      pendingSignup.email !== email
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "VERIFICATION_ACCESS_DENIED",
          message:
            "Verification session is invalid. Please start signup again.",
        },
        { status: 401 }
      );
    }

    /* =========================
       MAXIMUM ATTEMPTS CHECK
    ========================= */

    if (pendingSignup.otpAttempts >= 5) {
      await prisma.pendingSignup.delete({
        where: {
          id: pendingSignup.id,
        },
      });

      const response =
        NextResponse.json(
          {
            success: false,
            code:
              "OTP_ATTEMPTS_EXCEEDED",
            attemptsLeft: 0,
            message:
              "You have used all 5 attempts. Please start signup again.",
          },
          { status: 429 }
        );

      response.cookies.delete(
        "cyberlearn_verification"
      );

      return response;
    }

    /* =========================
       OTP EXPIRY
    ========================= */

    if (
      new Date() >
      pendingSignup.otpExpiresAt
    ) {
      await prisma.pendingSignup.delete({
        where: {
          id: pendingSignup.id,
        },
      });

      const response =
        NextResponse.json(
          {
            success: false,
            code: "OTP_EXPIRED",
            message:
              "This verification code has expired. Please start signup again.",
          },
          { status: 410 }
        );

      response.cookies.delete(
        "cyberlearn_verification"
      );

      return response;
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
      pendingSignup.otpHash
    ) {
      /*
       * otpAttempts represents the number
       * of WRONG attempts already used.
       *
       * Example:
       *
       * Current = 0
       * Wrong #1 → new = 1 → 4 remaining
       *
       * Current = 4
       * Wrong #5 → new = 5 → 0 remaining
       */

      const newAttemptCount =
        pendingSignup.otpAttempts + 1;

      /* =========================
         5TH WRONG ATTEMPT
      ========================= */

      if (newAttemptCount >= 5) {
        await prisma.pendingSignup.delete({
          where: {
            id: pendingSignup.id,
          },
        });

        const response =
          NextResponse.json(
            {
              success: false,
              code:
                "OTP_ATTEMPTS_EXCEEDED",
              attemptsLeft: 0,
              message:
                "Incorrect OTP. You have used all 5 attempts. Please start signup again.",
            },
            { status: 429 }
          );

        /*
         * Invalidate the verification
         * access token as well.
         */

        response.cookies.delete(
          "cyberlearn_verification"
        );

        return response;
      }

      /* =========================
         RECORD WRONG ATTEMPT
      ========================= */

      await prisma.pendingSignup.update({
        where: {
          id: pendingSignup.id,
        },

        data: {
          otpAttempts:
            newAttemptCount,
        },
      });

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

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      await prisma.pendingSignup.delete({
        where: {
          id: pendingSignup.id,
        },
      });

      const response =
        NextResponse.json(
          {
            success: false,
            code: "ACCOUNT_EXISTS",
            message:
              "An account with this email already exists.",
          },
          { status: 409 }
        );

      response.cookies.delete(
        "cyberlearn_verification"
      );

      return response;
    }

    /* =========================
       CREATE VERIFIED USER
    ========================= */

    const user =
      await prisma.user.create({
        data: {
          firstName:
            pendingSignup.firstName,

          surname:
            pendingSignup.surname,

          email:
            pendingSignup.email,

          passwordHash:
            pendingSignup.passwordHash,

          emailVerified: true,
        },
      });

    /* =========================
       CREATE SESSION
    ========================= */

    const sessionToken =
      randomBytes(32).toString("hex");

    const tokenHash =
      hashSessionToken(
        sessionToken
      );

    /*
     * Session valid for 30 days.
     */

    const expiresAt = new Date(
      Date.now() +
        30 *
          24 *
          60 *
          60 *
          1000
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    /* =========================
       DELETE PENDING SIGNUP
       
       OTP + verification token
       can never be reused after
       successful verification.
    ========================= */

    await prisma.pendingSignup.delete({
      where: {
        id: pendingSignup.id,
      },
    });

    /* =========================
       SESSION COOKIE
    ========================= */

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "Email verified and account created successfully.",

          user: {
            id: user.id,
            firstName:
              user.firstName,
            surname:
              user.surname,
            email:
              user.email,
          },
        },

        { status: 200 }
      );

    /* =========================
       LOGIN SESSION COOKIE
    ========================= */

    response.cookies.set({
      name:
        "cyberlearn_session",

      value:
        sessionToken,

      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires: expiresAt,
    });

    /* =========================
       REMOVE VERIFICATION COOKIE
    ========================= */

    response.cookies.delete(
      "cyberlearn_verification"
    );

    return response;

  } catch (error) {
    console.error(
      "OTP verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while verifying the code.",
      },
      { status: 500 }
    );
  }
}