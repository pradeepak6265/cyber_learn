import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

import VerifySignupClient from "./VerifySignupClient";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function hashVerificationToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export default async function VerifySignupPage() {
  const cookieStore = await cookies();

  const verificationToken =
    cookieStore.get("cyberlearn_verification")?.value;

  if (!verificationToken) {
    redirect("/signup");
  }

  const verificationTokenHash =
    hashVerificationToken(verificationToken);

  const pendingSignup =
    await prisma.pendingSignup.findFirst({
      where: {
        verificationTokenHash,
      },
    });

  if (!pendingSignup) {
    redirect("/signup");
  }

  if (
    !pendingSignup.verificationTokenExpiresAt ||
    new Date() >
      pendingSignup.verificationTokenExpiresAt
  ) {
    redirect("/signup");
  }

  return (
    <VerifySignupClient
      email={pendingSignup.email}
    />
  );
}