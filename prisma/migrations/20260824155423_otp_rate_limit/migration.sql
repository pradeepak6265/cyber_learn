-- AlterTable
ALTER TABLE "pending_signups" ADD COLUMN     "otpRequestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpRequestWindowStart" TIMESTAMP(3);
