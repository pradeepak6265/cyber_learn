/*
  Warnings:

  - A unique constraint covering the columns `[verificationTokenHash]` on the table `pending_signups` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "password_reset_tokens_expiresAt_idx";

-- AlterTable
ALTER TABLE "pending_signups" ADD COLUMN     "verificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pending_signups_verificationTokenHash_key" ON "pending_signups"("verificationTokenHash");
