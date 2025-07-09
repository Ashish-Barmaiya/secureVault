/*
  Warnings:

  - You are about to drop the column `ncryptedRecoveryKey` on the `Vault` table. All the data in the column will be lost.
  - Added the required column `encryptedRecoveryKey` to the `Vault` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vault" DROP COLUMN "ncryptedRecoveryKey",
ADD COLUMN     "encryptedRecoveryKey" TEXT NOT NULL;
