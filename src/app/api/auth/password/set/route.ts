import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RequestBody = {
  newPassword?: unknown;
  confirmPassword?: unknown;
};

/* =========================
   PASSWORD VALIDATION
========================= */

function validatePassword(
  password: string
) {
  return {
    length:
      password.length >= 8 &&
      password.length <= 25,

    uppercase:
      /[A-Z]/.test(password),

    lowercase:
      /[a-z]/.test(password),

    number:
      /[0-9]/.test(password),

    special:
      /[^A-Za-z0-9]/.test(password),
  };
}

function isPasswordValid(
  password: string
) {
  const rules =
    validatePassword(password);

  return Object.values(rules).every(
    Boolean
  );
}

/* =========================
   POST /api/auth/password/set
========================= */

export async function POST(
  request: Request
) {
  try {
    const user =
      await requireUser();

    const body =
      (await request.json()) as RequestBody;

    const newPassword =
      typeof body.newPassword ===
      "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "New password and confirm password are required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       PASSWORD RULES
    ========================= */

    if (
      !isPasswordValid(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_NEW_PASSWORD",
          message:
            "New password does not meet the required password rules.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CONFIRM PASSWORD
    ========================= */

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_MISMATCH",
          message:
            "New password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

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
          passwordHash: true,
          googleId: true,
          authProvider: true,
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
       GOOGLE-ONLY ACCOUNT CHECK
    ========================= */

    if (
      databaseUser.authProvider !==
        "google" ||
      !databaseUser.googleId
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "PASSWORD_ALREADY_CONFIGURED",
          message:
            "Your account already has a password. Please use Change Password instead.",
        },
        { status: 400 }
      );
    }

    /* =========================
       HASH PASSWORD
    ========================= */

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    /* =========================
       SAVE PASSWORD
    ========================= */

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        passwordHash,

        /*
         * The account now has both:
         *
         * 1. Google authentication
         * 2. Password authentication
         *
         * Therefore it is no longer a
         * Google-only account.
         */
        authProvider:
          "password+google",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Password set successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Set password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "PASSWORD_SET_ERROR",
        message:
          "Something went wrong while setting your password.",
      },
      { status: 500 }
    );
  }
}