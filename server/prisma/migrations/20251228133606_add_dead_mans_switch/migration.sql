-- CreateEnum
CREATE TYPE "VaultState" AS ENUM ('ACTIVE', 'GRACE', 'INHERITABLE', 'CLAIMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'VAULT_UNLOCK_SUCCESS';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_UNLOCK_FAILED';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_STATE_GRACE';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_STATE_INHERITABLE';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_STATE_CLAIMED';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_LIVENESS_RESET';

-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "graceStartedAt" TIMESTAMP(3),
ADD COLUMN     "lastFailureAt" TIMESTAMP(3),
ADD COLUMN     "lastSuccessfulUnlockAt" TIMESTAMP(3),
ADD COLUMN     "missedIntervals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "state" "VaultState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unlockFailureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vaultUnlockCounter" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UnlockChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockAttestation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "attestationBlob" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UnlockAttestation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnlockChallenge_userId_used_expiresAt_idx" ON "UnlockChallenge"("userId", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "UnlockAttestation_userId_createdAt_idx" ON "UnlockAttestation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UnlockAttestation_vaultId_createdAt_idx" ON "UnlockAttestation"("vaultId", "createdAt");

-- AddForeignKey
ALTER TABLE "UnlockChallenge" ADD CONSTRAINT "UnlockChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockChallenge" ADD CONSTRAINT "UnlockChallenge_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockAttestation" ADD CONSTRAINT "UnlockAttestation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockAttestation" ADD CONSTRAINT "UnlockAttestation_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
