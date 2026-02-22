/*
  Warnings:

  - You are about to drop the column `deaths` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `deaths` on the `TeamPlayerStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerStats" DROP COLUMN "deaths";

-- AlterTable
ALTER TABLE "TeamPlayerStats" DROP COLUMN "deaths",
ADD COLUMN     "present" BOOLEAN NOT NULL DEFAULT true;
