-- CreateTable
CREATE TABLE "email_change_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentEmail" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "verificationTokenHash" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "newEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationRequestCount" INTEGER NOT NULL DEFAULT 0,
    "verificationRequestWindowStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_change_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_change_verifications_verificationTokenHash_key" ON "email_change_verifications"("verificationTokenHash");

-- CreateIndex
CREATE INDEX "email_change_verifications_userId_idx" ON "email_change_verifications"("userId");

-- CreateIndex
CREATE INDEX "email_change_verifications_newEmail_idx" ON "email_change_verifications"("newEmail");

-- CreateIndex
CREATE INDEX "email_change_verifications_verificationTokenExpiresAt_idx" ON "email_change_verifications"("verificationTokenExpiresAt");

-- AddForeignKey
ALTER TABLE "email_change_verifications" ADD CONSTRAINT "email_change_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
