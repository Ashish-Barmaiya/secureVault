-- DropForeignKey
ALTER TABLE "Heir" DROP CONSTRAINT "Heir_userId_fkey";

-- AlterTable
ALTER TABLE "Heir" ADD COLUMN     "encryptedPrivateKey" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "publicKey" TEXT,
ADD COLUMN     "salt" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "encryptedVaultKeyByHeir" TEXT;

-- AddForeignKey
ALTER TABLE "Heir" ADD CONSTRAINT "Heir_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
