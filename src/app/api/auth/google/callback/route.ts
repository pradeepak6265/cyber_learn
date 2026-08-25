import { NextResponse } from "next/server";
import {
  createHash,
  randomBytes,
} from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME =
  "cyberlearn_session";

const GOOGLE_STATE_COOKIE =
  "cyberlearn_google_oauth_state";

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

function createSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: Date
) {
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
}

function redirectWithError(
  message: string
) {
  const url =
    new URL(
      "/login",
      getAppUrl()
    );

  url.searchParams.set(
    "google_error",
    message
  );

  return NextResponse.redirect(
    url
  );
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
     * User cancelled or Google
     * rejected the authorization.
     */
    if (oauthError) {
      return redirectWithError(
        "Google authentication was cancelled or denied."
      );
    }

    /*
     * Both code and state are required.
     */
    if (
      !code ||
      !returnedState
    ) {
      return redirectWithError(
        "Invalid Google authentication response."
      );
    }

    const cookieStore =
      await cookies();

    const storedStateHash =
      cookieStore.get(
        GOOGLE_STATE_COOKIE
      )?.value;

    /*
     * State must exist and match.
     */
    if (!storedStateHash) {
      return redirectWithError(
        "Google authentication session expired. Please try again."
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
      return redirectWithError(
        "Invalid Google authentication state."
      );
    }

    /*
     * Read OAuth credentials.
     */
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

    const redirectUri =
      `${getAppUrl()}/api/auth/google/callback`;

    /*
     * Exchange authorization code
     * for Google access token.
     */
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
        "Google token exchange failed:",
        tokenData
      );

      return redirectWithError(
        "Unable to complete Google authentication."
      );
    }

    /*
     * Fetch the authenticated
     * Google user's OpenID information.
     */
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
        "Google userinfo failed:",
        googleUser
      );

      return redirectWithError(
        "Unable to retrieve your Google account information."
      );
    }

    /*
     * We only allow accounts where
     * Google confirms the email.
     */
    if (
      googleUser.email_verified !==
      true
    ) {
      return redirectWithError(
        "Your Google email address could not be verified."
      );
    }

    const googleId =
      googleUser.sub;

    const email =
      normalizeEmail(
        googleUser.email
      );

    const firstName =
      (
        googleUser.given_name ||
        googleUser.name ||
        "User"
      ).trim();

    const surname =
      (
        googleUser.family_name ||
        ""
      ).trim();

    /*
     * Find the account by Google ID
     * first.
     */
    let user =
      await prisma.user.findUnique({
        where: {
          googleId,
        },
      });

    /*
     * If no Google ID is connected,
     * check whether this email already
     * belongs to a CyberLearn account.
     */
    if (!user) {
      user =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });
    }

    /*
     * Existing account.
     */
    if (user) {
      /*
       * If the existing account has
       * another Google ID, do not silently
       * take over or replace the connection.
       */
      if (
        user.googleId &&
        user.googleId !== googleId
      ) {
        return redirectWithError(
          "This email address is already connected to another Google account."
        );
      }

      /*
       * Existing password account:
       *
       * Connect Google only when the
       * Google email matches the existing
       * verified account.
       */
      if (
        !user.googleId
      ) {
        if (
          !user.emailVerified
        ) {
          return redirectWithError(
            "Please verify your CyberLearn email before connecting Google."
          );
        }

        user =
          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              googleId,
              authProvider:
                "google",
            },
          });
      }
    } else {
      /*
       * New Google account.
       *
       * passwordHash remains required by
       * the current schema, so generate a
       * cryptographically random unusable
       * password hash value.
       *
       * Google authentication remains the
       * authentication method for this account.
       */
      const randomPassword =
        randomBytes(48).toString(
          "hex"
        );

      const passwordHash =
        hashValue(
          randomPassword
        );

      user =
        await prisma.user.create({
          data: {
            firstName:
              firstName || "User",

            surname,

            email,

            passwordHash,

            emailVerified:
              true,

            googleId,

            authProvider:
              "google",
          },
        });
    }

    /*
     * Create the same server-side
     * CyberLearn session used by
     * password authentication.
     */
    const sessionToken =
      randomBytes(32).toString(
        "hex"
      );

    const tokenHash =
      hashValue(
        sessionToken
      );

    const expiresAt =
      new Date(
        Date.now() +
          30 *
            24 *
            60 *
            60 *
            1000
      );

    await prisma.session.create({
      data: {
        userId:
          user.id,

        tokenHash,

        expiresAt,
      },
    });

    /*
     * Redirect to dashboard and
     * establish the HTTP-only session.
     */
    const response =
      NextResponse.redirect(
        new URL(
          "/dashboard",
          getAppUrl()
        )
      );

    createSessionCookie(
      response,
      sessionToken,
      expiresAt
    );

    /*
     * Remove the temporary OAuth
     * state cookie after successful
     * authentication.
     */
    response.cookies.delete(
      GOOGLE_STATE_COOKIE
    );

    return response;
  } catch (error) {
    console.error(
      "Google OAuth callback error:",
      error
    );

    return redirectWithError(
      "Something went wrong while signing in with Google."
    );
  }
}