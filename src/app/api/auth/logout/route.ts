import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

/* =========================
   HASH SESSION TOKEN
========================= */

function hashSessionToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/* =========================
   POST /api/auth/logout
========================= */

export async function POST(
  request: Request
) {
  try {
    /*
     * Read authentication cookie
     * from the incoming request.
     */
    const cookieHeader =
      request.headers.get("cookie");

    let sessionToken: string | null =
      null;

    if (cookieHeader) {
      const cookies =
        cookieHeader
          .split(";")
          .map((cookie) =>
            cookie.trim()
          );

      const sessionCookie =
        cookies.find(
          (cookie) =>
            cookie.startsWith(
              `${SESSION_COOKIE_NAME}=`
            )
        );

      if (sessionCookie) {
        sessionToken =
          decodeURIComponent(
            sessionCookie.substring(
              SESSION_COOKIE_NAME.length + 1
            )
          );
      }
    }

    /*
     * Invalidate the current session
     * in the database.
     *
     * deleteMany is intentionally used
     * so the logout endpoint remains safe
     * even if the session was already removed.
     */
    if (sessionToken) {
      const tokenHash =
        hashSessionToken(
          sessionToken
        );

      await prisma.session.deleteMany({
        where: {
          tokenHash,
        },
      });
    }

    /*
     * Create successful logout response.
     */
    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Logged out successfully.",
        },
        { status: 200 }
      );

    /*
     * Delete authentication cookie.
     *
     * Same name/path/security settings
     * are used so the existing cookie
     * is correctly removed.
     */
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
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
      "Logout API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while logging out.",
      },
      { status: 500 }
    );
  }
}