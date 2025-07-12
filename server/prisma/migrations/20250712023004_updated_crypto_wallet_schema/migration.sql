/*
  Warnings:

  - The values [SOCAIAL_MEDIA_ACCOUNT] on the enum `AssetType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'VAULT_CREATED';

-- AlterEnum
BEGIN;
CREATE TYPE "AssetType_new" AS ENUM ('BANK_ACCOUNT', 'CRYPTO_WALLET', 'NFT', 'SOCIAL_MEDIA_ACCOUNT');
ALTER TABLE "DigitalAsset" ALTER COLUMN "type" TYPE "AssetType_new" USING ("type"::text::"AssetType_new");
ALTER TYPE "AssetType" RENAME TO "AssetType_old";
ALTER TYPE "AssetType_new" RENAME TO "AssetType";
DROP TYPE "AssetType_old";
COMMIT;

-- AlterTable
ALTER TABLE "CryptoWallet" ADD COLUMN     "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "walletType" TEXT;
