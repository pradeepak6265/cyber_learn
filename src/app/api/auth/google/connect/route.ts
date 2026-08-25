import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE =
  "cyberlearn_google_connect_state";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(
      /\/$/,
      ""
    );

  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not configured."
    );
  }

  return appUrl;
}

export async function GET() {
  try {
    const user =
      await requireUser();

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error(
        "GOOGLE_CLIENT_ID is not configured."
      );
    }

    /*
     * Generate a cryptographically random
     * OAuth state value.
     */
    const state =
      randomBytes(32).toString("hex");

    /*
     * Store the hash in the cookie.
     * The raw state is sent to Google.
     */
    const stateHash =
      createHash("sha256")
        .update(state)
        .digest("hex");

    const redirectUri =
      `${getAppUrl()}/api/auth/google/connect/callback`;

    const authorizationUrl =
      new URL(GOOGLE_AUTH_URL);

    authorizationUrl.searchParams.set(
      "client_id",
      clientId
    );

    authorizationUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    authorizationUrl.searchParams.set(
      "response_type",
      "code"
    );

    authorizationUrl.searchParams.set(
      "scope",
      "openid email profile"
    );

    authorizationUrl.searchParams.set(
      "state",
      state
    );

    authorizationUrl.searchParams.set(
      "prompt",
      "select_account"
    );

    /*
     * Include the logged-in user ID
     * inside a signed/hashed state flow.
     *
     * The callback will recover the user
     * from the authenticated session,
     * not from a user-controlled parameter.
     */
    const response =
      NextResponse.redirect(
        authorizationUrl
      );

    response.cookies.set({
      name:
        GOOGLE_STATE_COOKIE,

      value:
        stateHash,

      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 10 * 60,
    });

    /*
     * This endpoint only starts the
     * Google connection flow.
     *
     * No database change happens here.
     */
    void user;

    return response;
  } catch (error) {
    console.error(
      "Google connect start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "GOOGLE_CONNECT_START_ERROR",
        message:
          "Unable to start Google connection.",
      },
      { status: 500 }
    );
  }
}