-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'PENDING_MANAGER_APPROVAL', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "familyCode" TEXT;

-- AlterTable
ALTER TABLE "Connection" ADD COLUMN "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "approvingManagerId" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_familyCode_key" ON "User"("familyCode");
