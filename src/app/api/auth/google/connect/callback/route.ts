import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE =
  "cyberlearn_google_connect_state";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

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

function hashValue(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function redirectToAccountSettings(
  message?: string,
  success?: string
) {
  const url = new URL(
    "/account-settings",
    getAppUrl()
  );

  if (message) {
    url.searchParams.set(
      "google_error",
      message
    );
  }

  if (success) {
    url.searchParams.set(
      "google_success",
      success
    );
  }

  return NextResponse.redirect(url);
}

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export async function GET(
  request: Request
) {
  try {
    /* =========================
       CHECK CURRENT SESSION
    ========================= */

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return redirectToAccountSettings(
        "Your session has expired. Please login again."
      );
    }

    /* =========================
       READ GOOGLE RESPONSE
    ========================= */

    const requestUrl =
      new URL(request.url);

    const code =
      requestUrl.searchParams.get(
        "code"
      );

    const returnedState =
      requestUrl.searchParams.get(
        "state"
      );

    const oauthError =
      requestUrl.searchParams.get(
        "error"
      );

    /*
     * User cancelled the Google
     * authorization screen.
     */
    if (oauthError) {
      return redirectToAccountSettings(
        "Google connection was cancelled."
      );
    }

    /*
     * Both authorization code and
     * state are required.
     */
    if (
      !code ||
      !returnedState
    ) {
      return redirectToAccountSettings(
        "Invalid Google connection response."
      );
    }

    /* =========================
       VERIFY OAUTH STATE
    ========================= */

    const cookieStore =
      await cookies();

    const storedStateHash =
      cookieStore.get(
        GOOGLE_STATE_COOKIE
      )?.value;

    if (!storedStateHash) {
      return redirectToAccountSettings(
        "Google connection session expired. Please try again."
      );
    }

    const returnedStateHash =
      hashValue(
        returnedState
      );

    if (
      returnedStateHash !==
      storedStateHash
    ) {
      return redirectToAccountSettings(
        "Invalid Google connection state."
      );
    }

    /* =========================
       GOOGLE CREDENTIALS
    ========================= */

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret
    ) {
      throw new Error(
        "Google OAuth credentials are not configured."
      );
    }

    /* =========================
       REDIRECT URI
    ========================= */

    const redirectUri =
      `${getAppUrl()}/api/auth/google/connect/callback`;

    /* =========================
       EXCHANGE CODE FOR TOKEN
    ========================= */

    const tokenResponse =
      await fetch(
        GOOGLE_TOKEN_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              code,

              client_id:
                clientId,

              client_secret:
                clientSecret,

              redirect_uri:
                redirectUri,

              grant_type:
                "authorization_code",
            }).toString(),

          cache: "no-store",
        }
      );

    const tokenData =
      (await tokenResponse.json()) as GoogleTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "Google connect token exchange failed:",
        tokenData
      );

      return redirectToAccountSettings(
        "Unable to complete Google connection."
      );
    }

    /* =========================
       GET GOOGLE USER INFO
    ========================= */

    const userInfoResponse =
      await fetch(
        GOOGLE_USERINFO_URL,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },

          cache: "no-store",
        }
      );

    const googleUser =
      (await userInfoResponse.json()) as GoogleUserInfo;

    if (
      !userInfoResponse.ok ||
      !googleUser.sub ||
      !googleUser.email
    ) {
      console.error(
        "Google connect userinfo failed:",
        googleUser
      );

      return redirectToAccountSettings(
        "Unable to retrieve your Google account information."
      );
    }

    /* =========================
       GOOGLE EMAIL VERIFICATION
    ========================= */

    if (
      googleUser.email_verified !==
      true
    ) {
      return redirectToAccountSettings(
        "Your Google email address could not be verified."
      );
    }

    const googleId =
      googleUser.sub;

    const googleEmail =
      normalizeEmail(
        googleUser.email
      );

    const accountEmail =
      normalizeEmail(
        currentUser.email
      );

    /* =========================
       SAME EMAIL CHECK
    ========================= */

    if (
      googleEmail !==
      accountEmail
    ) {
      return redirectToAccountSettings(
        "The Google email address must match your CyberLearn account email."
      );
    }

    /* =========================
       CHECK GOOGLE ID
    ========================= */

    const existingGoogleUser =
      await prisma.user.findUnique({
        where: {
          googleId,
        },

        select: {
          id: true,
          email: true,
        },
      });

    /*
     * This Google account is already
     * connected to another CyberLearn
     * account.
     */
    if (
      existingGoogleUser &&
      existingGoogleUser.id !==
        currentUser.id
    ) {
      return redirectToAccountSettings(
        "This Google account is already connected to another CyberLearn account."
      );
    }

    /* =========================
       GET CURRENT DATABASE USER
    ========================= */

    const databaseUser =
      await prisma.user.findUnique({
        where: {
          id: currentUser.id,
        },

        select: {
          id: true,
          email: true,
          googleId: true,
          authProvider: true,
        },
      });

    if (!databaseUser) {
      return redirectToAccountSettings(
        "Your account could not be found."
      );
    }

    /*
     * Extra server-side email check
     * against the database value.
     */
    if (
      normalizeEmail(
        databaseUser.email
      ) !== googleEmail
    ) {
      return redirectToAccountSettings(
        "The Google email address does not match your CyberLearn account."
      );
    }

    /* =========================
       ALREADY CONNECTED
    ========================= */

    if (
      databaseUser.googleId ===
      googleId
    ) {
      return redirectToAccountSettings(
        undefined,
        "Google account is already connected."
      );
    }

    /* =========================
       CONNECT GOOGLE
    ========================= */

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },

      data: {
        googleId,

        /*
         * Keep the account capable of
         * password authentication as well.
         *
         * authProvider represents the
         * original/primary authentication
         * method and should not be changed
         * merely because Google is connected.
         */
        authProvider:
          databaseUser.authProvider,
      },
    });

    /* =========================
       REMOVE OAUTH STATE COOKIE
    ========================= */

    const response =
      redirectToAccountSettings(
        undefined,
        "Google account connected successfully."
      );

    response.cookies.delete(
      GOOGLE_STATE_COOKIE
    );

    return response;
  } catch (error) {
    console.error(
      "Google connect callback error:",
      error
    );

    return redirectToAccountSettings(
      "Something went wrong while connecting your Google account."
    );
  }
}