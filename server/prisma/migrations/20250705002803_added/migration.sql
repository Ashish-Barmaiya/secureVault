/*
  Warnings:

  - The values [LOGIN] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PASSWORD,DOCUMENT,MESSAGE] on the enum `AssetType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `encryptedData` on the `DigitalAsset` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `DigitalAsset` table. All the data in the column will be lost.
  - Added the required column `title` to the `DigitalAsset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('ACCOUNT_CREATED', 'TWO_FACTOR_AUTHENTICATION_ENABLED', 'ASSET_ADDED', 'ASSET_DELETED', 'HEIR_ADDED', 'DEATH_VERIFICATION_REQUESTED');
ALTER TABLE "ActivityLog" ALTER COLUMN "action" TYPE "ActionType_new" USING ("action"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AssetType_new" AS ENUM ('BANK_ACCOUNT', 'CRYPTO_WALLET', 'NFT', 'SOCAIAL_MEDIA_ACCOUNT');
ALTER TABLE "DigitalAsset" ALTER COLUMN "type" TYPE "AssetType_new" USING ("type"::text::"AssetType_new");
ALTER TYPE "AssetType" RENAME TO "AssetType_old";
ALTER TYPE "AssetType_new" RENAME TO "AssetType";
DROP TYPE "AssetType_old";
COMMIT;

-- AlterTable
ALTER TABLE "DigitalAsset" DROP COLUMN "encryptedData",
DROP COLUMN "metadata",
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "metadata" JSONB,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoWallet" (
    "id" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "publicAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "CryptoWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "metadataUrl" TEXT,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_assetId_idx" ON "BankAccount"("assetId");

-- CreateIndex
CREATE INDEX "CryptoWallet_assetId_network_idx" ON "CryptoWallet"("assetId", "network");

-- CreateIndex
CREATE INDEX "NFT_assetId_contractAddress_idx" ON "NFT"("assetId", "contractAddress");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_assetId_platform_idx" ON "SocialMediaAccount"("assetId", "platform");

-- CreateIndex
CREATE INDEX "DigitalAsset_userId_type_idx" ON "DigitalAsset"("userId", "type");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoWallet" ADD CONSTRAINT "CryptoWallet_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaAccount" ADD CONSTRAINT "SocialMediaAccount_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
