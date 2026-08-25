import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE =
  "cyberlearn_google_oauth_state";

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
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error(
        "GOOGLE_CLIENT_ID is not configured."
      );
    }

    /*
     * Generate a cryptographically random
     * state value for OAuth CSRF protection.
     */
    const state =
      randomBytes(32).toString("hex");

    /*
     * Store only a SHA-256 hash in the cookie.
     * The raw state is sent to Google.
     */
    const stateHash =
      createHash("sha256")
        .update(state)
        .digest("hex");

    const redirectUri =
      `${getAppUrl()}/api/auth/google/callback`;

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

    /*
     * We only need authentication/identity
     * information at this stage.
     */
    authorizationUrl.searchParams.set(
      "prompt",
      "select_account"
    );

    const response =
      NextResponse.redirect(
        authorizationUrl
      );

    /*
     * Short-lived, HTTP-only OAuth state cookie.
     *
     * SameSite=Lax allows the cookie to be
     * sent during Google's top-level redirect
     * back to our callback endpoint.
     */
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

    return response;
  } catch (error) {
    console.error(
      "Google OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "GOOGLE_OAUTH_START_ERROR",
        message:
          "Unable to start Google authentication.",
      },
      { status: 500 }
    );
  }
}