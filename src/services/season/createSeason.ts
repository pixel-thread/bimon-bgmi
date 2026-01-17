import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.SeasonCreateInput;
};

export async function createSeason({ data }: Props) {
  return await prisma.$transaction(async (tx) => {
    const players = await tx.player.findMany();

    const activeSeason = await tx.season.findFirst({
      where: { status: "ACTIVE" },
    });

    // Get the solo tax pool from the previous season (if any)
    let previousPool: { amount: number; donorName: string | null } | null = null;
    if (activeSeason) {
      const pool = await tx.soloTaxPool.findFirst({
        where: { seasonId: activeSeason.id },
      });
      if (pool && pool.amount > 0) {
        previousPool = { amount: pool.amount, donorName: pool.donorName };
        // Reset the old season's pool
        await tx.soloTaxPool.update({
          where: { id: pool.id },
          data: { amount: 0, donorName: null },
        });
      }
    }

    if (activeSeason) {
      await tx.season.update({
        where: { id: activeSeason.id },
        data: {
          status: "INACTIVE",
          endDate: new Date(), // Set end date when closing the season
        },
      });
    }

    const season = await tx.season.create({
      data: {
        startDate: new Date(data.startDate),
        description: data.description,
        name: data.name,
        createdBy: data.createdBy,
      },
    });

    // Transfer the solo tax pool to the new season
    if (previousPool && previousPool.amount > 0) {
      await tx.soloTaxPool.create({
        data: {
          seasonId: season.id,
          amount: previousPool.amount,
          donorName: previousPool.donorName,
        },
      });
    }

    if (players.length > 0) {
      await tx.playerStats.createMany({
        data: players.map((player) => ({
          playerId: player.id,
          seasonId: season.id,
        })),
      });
    }

    return season;
  });
}
