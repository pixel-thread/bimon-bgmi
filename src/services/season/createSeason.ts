import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getActiveSeason } from "./getActiveSeason";
import { getAllPlayers } from "../player/getAllPlayers";

type Props = {
  data: Prisma.SeasonCreateInput;
};

export async function createSeason({ data }: Props) {
  const activeSeason = await getActiveSeason();

  if (activeSeason) {
    await prisma.season.update({
      where: { id: activeSeason.id },
      data: { status: "INACTIVE" },
    });
  }

  return await prisma.$transaction(async (tx) => {
    // Fetch players inside the transaction for consistency
    const [players] = await getAllPlayers({
      where: {},
    });

    const season = await tx.season.create({
      data: {
        startDate: new Date(data.startDate),
        description: data.description,
        name: data.name,
        createdBy: data.createdBy,
      },
    });

    // Corrected for..of loop for iteration over player objects
    for (const player of players) {
      await tx.playerStats.create({
        data: {
          playerId: player.id,
          seasonId: season.id,
        },
      });
    }

    return season;
  });
}
