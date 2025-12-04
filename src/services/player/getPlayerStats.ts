import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  seasonId?: string;
};

export async function getPlayerStatsByPlayerId({ playerId, seasonId }: Props) {
  // If seasonId is 'all' or empty, aggregate stats across all seasons
  if (!seasonId || seasonId === "all") {
    const allStats = await prisma.playerStats.findMany({
      where: { playerId },
      include: { matches: true },
    });

    // Aggregate kills, deaths, and matches
    const aggregated = {
      id: `${playerId}-all`,
      playerId,
      seasonId: "all",
      kills: allStats.reduce((acc, stat) => acc + stat.kills, 0),
      deaths: allStats.reduce((acc, stat) => acc + stat.deaths, 0),
      matches: allStats.flatMap((stat) => stat.matches),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return aggregated;
  }

  // For specific season, use the original logic
  return await prisma.playerStats.findUnique({
    where: { seasonId_playerId: { playerId, seasonId } },
    include: { matches: true },
  });
}
