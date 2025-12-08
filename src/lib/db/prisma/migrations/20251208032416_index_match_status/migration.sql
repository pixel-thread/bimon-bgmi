/*
  Warnings:

  - You are about to drop the column `status` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Team` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Match_status_idx";

-- DropIndex
DROP INDEX "public"."Team_status_idx";

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "isGlobalBackground" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "TournamentWinner" ADD COLUMN     "isDistributed" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "public"."MatchStatus";
