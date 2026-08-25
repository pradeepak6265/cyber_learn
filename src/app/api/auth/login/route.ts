import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

/* =========================
   HELPERS
========================= */

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/* =========================
   POST /api/auth/login
========================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       FIND USER
    ========================= */

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    /*
     * Use the same generic error for
     * unknown email and wrong password.
     *
     * This avoids exposing whether an
     * account exists.
     */
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          message:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    /* =========================
       PASSWORD CHECK
    ========================= */

    const passwordValid =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          message:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    /* =========================
       EMAIL VERIFICATION
    ========================= */

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email before logging in.",
        },
        { status: 403 }
      );
    }

    /* =========================
       CREATE SESSION TOKEN
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
    const expiresAt =
      new Date(
        Date.now() +
          30 *
            24 *
            60 *
            60 *
            1000
      );

    /* =========================
       STORE SESSION
    ========================= */

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    /* =========================
       RESPONSE
    ========================= */

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Login successful.",
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
       AUTHENTICATION COOKIE
    ========================= */

    response.cookies.set({
      name:
        SESSION_COOKIE_NAME,

      value:
        sessionToken,

      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires:
        expiresAt,
    });

    return response;
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "LOGIN_ERROR",
        message:
          "Something went wrong while logging in.",
      },
      { status: 500 }
    );
  }
}