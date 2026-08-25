import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* =========================
   PASSWORD VALIDATION
========================= */

function isValidPassword(
  password: string
) {
  return (
    password.length >= 8 &&
    password.length <= 25 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/* =========================
   POST /api/auth/password/change
========================= */

export async function POST(
  request: Request
) {
  try {
    /* =========================
       REQUIRE LOGIN
    ========================= */

    const user =
      await requireUser();

    /* =========================
       READ REQUEST
    ========================= */

    const body =
      await request.json();

    const currentPassword =
      typeof body.currentPassword ===
      "string"
        ? body.currentPassword
        : "";

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
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "All password fields are required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       NEW PASSWORD VALIDATION
       
       Same requirements as signup:
       - 8 to 25 characters
       - uppercase
       - lowercase
       - number
       - special character
    ========================= */

    if (
      !isValidPassword(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_NEW_PASSWORD",
          message:
            "Password does not meet the required security requirements.",
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
          code:
            "PASSWORD_MISMATCH",
          message:
            "Confirm password is not same.",
        },
        { status: 400 }
      );
    }

    /* =========================
       GET DATABASE USER
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
       GOOGLE-ONLY ACCOUNT
       
       Google-only users must use
       Set Password instead.
    ========================= */

    if (
      databaseUser.authProvider ===
        "google" &&
      databaseUser.googleId
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "PASSWORD_NOT_CONFIGURED",
          message:
            "Please use Set Password before changing your password.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CURRENT PASSWORD CHECK
       
       IMPORTANT:
       Server verifies current
       password BEFORE changing it.
    ========================= */

    const currentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        databaseUser.passwordHash
      );

    if (
      !currentPasswordValid
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_CURRENT_PASSWORD",
          message:
            "Current password is incorrect.",
        },
        { status: 401 }
      );
    }

    /* =========================
       PREVENT SAME PASSWORD
    ========================= */

    const samePassword =
      await bcrypt.compare(
        newPassword,
        databaseUser.passwordHash
      );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          code:
            "SAME_PASSWORD",
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    /* =========================
       HASH NEW PASSWORD
    ========================= */

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    /* =========================
       UPDATE PASSWORD
    ========================= */

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        passwordHash:
          newPasswordHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Password changed successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "PASSWORD_CHANGE_ERROR",
        message:
          "Something went wrong while changing your password.",
      },
      { status: 500 }
    );
  }
}