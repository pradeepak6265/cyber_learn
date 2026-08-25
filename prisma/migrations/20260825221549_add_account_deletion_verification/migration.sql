-- CreateTable
CREATE TABLE "account_deletion_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_deletion_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_deletion_verifications_userId_idx" ON "account_deletion_verifications"("userId");

-- CreateIndex
CREATE INDEX "account_deletion_verifications_otpExpiresAt_idx" ON "account_deletion_verifications"("otpExpiresAt");

-- AddForeignKey
ALTER TABLE "account_deletion_verifications" ADD CONSTRAINT "account_deletion_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
