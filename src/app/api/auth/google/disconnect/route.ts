import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user =
      await requireUser();

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
       CHECK GOOGLE CONNECTION
    ========================= */

    if (!databaseUser.googleId) {
      return NextResponse.json(
        {
          success: false,
          code: "GOOGLE_NOT_CONNECTED",
          message:
            "Your Google account is not connected.",
        },
        { status: 400 }
      );
    }

    /* =========================
       GOOGLE-ONLY ACCOUNT
    ========================= */

    /*
     * A Google-only account has no
     * independent password login.
     *
     * Do not allow the user to disconnect
     * Google until a password has been set.
     */
    if (
      databaseUser.authProvider ===
      "google"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_REQUIRED",
          message:
            "Please set a password before disconnecting Google.",
        },
        { status: 400 }
      );
    }

    /* =========================
       DISCONNECT GOOGLE
    ========================= */

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        googleId: null,

        /*
         * After disconnecting Google,
         * only password authentication
         * remains available.
         */
        authProvider: "password",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Google account disconnected successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Google disconnect error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "GOOGLE_DISCONNECT_ERROR",
        message:
          "Something went wrong while disconnecting your Google account.",
      },
      { status: 500 }
    );
  }
}