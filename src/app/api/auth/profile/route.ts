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

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function isValidName(name: string) {
  return /^[A-Za-z\s'-]{2,25}$/.test(
    name.trim()
  );
}

/* =========================
   GET AUTHENTICATED USER
========================= */

async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash =
    hashSessionToken(sessionToken);

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
   UPDATE PROFILE
========================= */

export async function PATCH(
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
            "You must be logged in to update your profile.",
        },
        { status: 401 }
      );
    }

    /* =========================
       REQUEST BODY
    ========================= */

    const body =
      await request.json();

    const firstName =
      typeof body.firstName ===
      "string"
        ? body.firstName.trim()
        : "";

    const surname =
      typeof body.surname ===
      "string"
        ? body.surname.trim()
        : "";

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (!firstName || !surname) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message:
            "First name and surname are required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       NAME VALIDATION
       
       Same rule as signup.
    ========================= */

    if (!isValidName(firstName)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_FIRST_NAME",
          message:
            "First name must contain 2 to 25 valid characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidName(surname)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SURNAME",
          message:
            "Surname must contain 2 to 25 valid characters.",
        },
        { status: 400 }
      );
    }

    /* =========================
       UPDATE CURRENT USER
       
       IMPORTANT:
       User ID comes from the
       authenticated session.
       
       It is NOT accepted from
       the client.
    ========================= */

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstName,
          surname,
        },
      });

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json(
      {
        success: true,
        message:
          "Profile information updated successfully.",
        user: {
          id: updatedUser.id,
          firstName:
            updatedUser.firstName,
          surname:
            updatedUser.surname,
          email:
            updatedUser.email,
          emailVerified:
            updatedUser.emailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Profile update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "PROFILE_UPDATE_ERROR",
        message:
          "Something went wrong while updating your profile.",
      },
      { status: 500 }
    );
  }
}