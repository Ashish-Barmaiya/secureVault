-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'LINKED');

-- AlterTable
ALTER TABLE "Heir" ADD COLUMN     "linkStatus" "LinkStatus";
