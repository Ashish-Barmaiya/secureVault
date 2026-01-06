/*
  Warnings:

  - The values [ASSET_ADDED] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BANK_ACCOUNT,NFT,SOCIAL_MEDIA_ACCOUNT] on the enum `AssetType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CryptoWallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DigitalAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialMediaAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'HEIR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('ACCOUNT', 'VAULT', 'ASSET', 'HEIR_LINK');

-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_assetId_fkey";

-- DropForeignKey
ALTER TABLE "CryptoWallet" DROP CONSTRAINT "CryptoWallet_assetId_fkey";

-- DropForeignKey
ALTER TABLE "DigitalAsset" DROP CONSTRAINT "DigitalAsset_userId_fkey";

-- DropForeignKey
ALTER TABLE "DigitalAsset" DROP CONSTRAINT "DigitalAsset_vaultId_fkey";

-- DropForeignKey
ALTER TABLE "NFT" DROP CONSTRAINT "NFT_assetId_fkey";

-- DropForeignKey
ALTER TABLE "SocialMediaAccount" DROP CONSTRAINT "SocialMediaAccount_assetId_fkey";

-- DropTable
DROP TABLE "BankAccount";

-- DropTable
DROP TABLE "CryptoWallet";

-- DropTable
DROP TABLE "DigitalAsset";

-- DropTable
DROP TABLE "NFT";

-- DropTable
DROP TABLE "SocialMediaAccount";

-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('ACCOUNT_CREATED', 'TWO_FACTOR_AUTHENTICATION_ENABLED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_UPDATED', 'USER_DELETED', 'USER_RESTORED', 'USER_PASSWORD_RESET', 'VAULT_CREATED', 'VAULT_UPDATED', 'VAULT_DELETED', 'VAULT_RESTORED', 'VAULT_PASSWORD_RESET', 'VAULT_TRANSFERRED', 'VAULT_UNLOCK_SUCCESS', 'VAULT_UNLOCK_FAILED', 'VAULT_STATE_GRACE', 'VAULT_STATE_INHERITABLE', 'VAULT_STATE_CLAIMED', 'VAULT_LIVENESS_RESET', 'ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_DELETED', 'ASSET_REVEAL_REQUESTED', 'ASSET_HIDE_REQUESTED', 'HEIR_ADDED', 'HEIR_REMOVED', 'HEIR_UPDATED', 'DEATH_VERIFICATION_REQUESTED', 'DEATH_VERIFICATION_APPROVED', 'DEATH_VERIFICATION_REJECTED', 'DEATH_VERIFICATION_UPDATED');
ALTER TABLE "ActivityLog" ALTER COLUMN "action" TYPE "ActionType_new" USING ("action"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AssetType_new" AS ENUM ('CRYPTO_WALLET', 'SECRET_NOTE', 'BANK_ACCOUNT_INFO', 'INVESTMENT_ACCOUNT_INFO', 'LEGAL_INFO', 'DOCUMENT_REFERENCE', 'RECOVERY_PHRASE', 'EMAIL_ACCOUNT', 'IMPORTANT_NOTE');
-- REMOVED INVALID ALTER TABLE Asset
ALTER TYPE "AssetType" RENAME TO "AssetType_old";
ALTER TYPE "AssetType_new" RENAME TO "AssetType";
DROP TYPE "AssetType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditOutbox" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "AuditOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT,
    "eventType" TEXT NOT NULL,
    "summary" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_vaultId_idx" ON "Asset"("vaultId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
