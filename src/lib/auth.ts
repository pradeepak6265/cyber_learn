import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

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
   GET CURRENT USER
========================= */

export async function getCurrentUser() {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  /*
   * No authentication cookie.
   */
  if (!sessionToken) {
    return null;
  }

  const tokenHash =
    hashSessionToken(
      sessionToken
    );

  /*
   * Find a valid session.
   *
   * The session must:
   * - exist
   * - not be expired
   */
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

  /*
   * Invalid / expired session.
   */
  if (!session) {
    return null;
  }

  /*
   * Return only the user information
   * required by the application.
   *
   * Password hash is intentionally
   * not returned.
   */
  return {
    id: session.user.id,

    firstName:
      session.user.firstName,

    surname:
      session.user.surname,

    email:
      session.user.email,

    emailVerified:
      session.user.emailVerified,
  };
}

/* =========================
   REQUIRE AUTHENTICATED USER
========================= */

export async function requireUser() {
  const user =
    await getCurrentUser();

  /*
   * No valid session:
   * send the user to login.
   */
  if (!user) {
    redirect("/login");
  }

  /*
   * Valid authenticated user.
   */
  return user;
}