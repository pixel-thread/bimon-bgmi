/*
  Warnings:

  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UCTransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UCTransferType" AS ENUM ('REQUEST', 'SEND');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "playerId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UCTransfer" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "UCTransferType" NOT NULL,
    "status" "UCTransferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "fromPlayerId" TEXT NOT NULL,
    "toPlayerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UCTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UCTransfer_fromPlayerId_idx" ON "UCTransfer"("fromPlayerId");

-- CreateIndex
CREATE INDEX "UCTransfer_toPlayerId_idx" ON "UCTransfer"("toPlayerId");

-- CreateIndex
CREATE INDEX "UCTransfer_status_idx" ON "UCTransfer"("status");

-- CreateIndex
CREATE INDEX "Notification_playerId_idx" ON "Notification"("playerId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UCTransfer" ADD CONSTRAINT "UCTransfer_fromPlayerId_fkey" FOREIGN KEY ("fromPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UCTransfer" ADD CONSTRAINT "UCTransfer_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
