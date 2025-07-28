-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'USER_LOGIN';
ALTER TYPE "ActionType" ADD VALUE 'USER_LOGOUT';
ALTER TYPE "ActionType" ADD VALUE 'USER_UPDATED';
ALTER TYPE "ActionType" ADD VALUE 'USER_DELETED';
ALTER TYPE "ActionType" ADD VALUE 'USER_RESTORED';
ALTER TYPE "ActionType" ADD VALUE 'USER_PASSWORD_RESET';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_UPDATED';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_DELETED';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_RESTORED';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_PASSWORD_RESET';
ALTER TYPE "ActionType" ADD VALUE 'VAULT_TRANSFERRED';
ALTER TYPE "ActionType" ADD VALUE 'ASSET_UPDATED';
ALTER TYPE "ActionType" ADD VALUE 'HEIR_REMOVED';
ALTER TYPE "ActionType" ADD VALUE 'HEIR_UPDATED';
ALTER TYPE "ActionType" ADD VALUE 'DEATH_VERIFICATION_APPROVED';
ALTER TYPE "ActionType" ADD VALUE 'DEATH_VERIFICATION_REJECTED';
ALTER TYPE "ActionType" ADD VALUE 'DEATH_VERIFICATION_UPDATED';
