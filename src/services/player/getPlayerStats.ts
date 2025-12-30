import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  seasonId?: string;
};

export async function getPlayerStatsByPlayerId({ playerId, seasonId }: Props) {
  // Get the player's last match stats to calculate K/D trend
  const lastMatchStats = await prisma.teamPlayerStats.findFirst({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    select: {
      kills: true,
      matchId: true,
      createdAt: true,
    },
  });

  // If seasonId is 'all' or empty, aggregate stats across all seasons
  if (!seasonId || seasonId === "all") {
    const allStats = await prisma.playerStats.findMany({
      where: { playerId },
    });

    // Aggregate kills and deaths
    const totalKills = allStats.reduce((acc, stat) => acc + stat.kills, 0);
    const totalDeaths = allStats.reduce((acc, stat) => acc + stat.deaths, 0);

    // Calculate current K/D
    const currentKd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

    // Calculate previous K/D (excluding last match) for trend
    let kdTrend: "up" | "down" | "same" = "same";
    let kdChange = 0;
    let lastMatchKills = 0;

    if (lastMatchStats && totalDeaths > 0) {
      lastMatchKills = lastMatchStats.kills;
      // Previous stats = current stats - last match (1 kill per match, 1 death)
      const prevKills = totalKills - lastMatchKills;
      const prevDeaths = totalDeaths - 1;
      const prevKd = prevDeaths > 0 ? prevKills / prevDeaths : prevKills;

      kdChange = Number((currentKd - prevKd).toFixed(2));
      if (currentKd > prevKd + 0.01) {
        kdTrend = "up";
      } else if (currentKd < prevKd - 0.01) {
        kdTrend = "down";
      }
    }

    const aggregated = {
      id: `${playerId}-all`,
      playerId,
      seasonId: "all",
      kills: totalKills,
      deaths: totalDeaths,
      kd: Number(currentKd.toFixed(2)),
      kdTrend,
      kdChange,
      lastMatchKills,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return aggregated;
  }

  // For specific season, use the original logic
  const stats = await prisma.playerStats.findUnique({
    where: { seasonId_playerId: { playerId, seasonId } },
  });

  if (!stats) return null;

  // Calculate K/D for specific season
  const currentKd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;

  // Get last match in this season for trend
  const lastSeasonMatch = await prisma.teamPlayerStats.findFirst({
    where: { playerId, seasonId },
    orderBy: { createdAt: "desc" },
    select: { kills: true },
  });

  let kdTrend: "up" | "down" | "same" = "same";
  let kdChange = 0;
  let lastMatchKills = 0;

  if (lastSeasonMatch && stats.deaths > 0) {
    lastMatchKills = lastSeasonMatch.kills;
    const prevKills = stats.kills - lastMatchKills;
    const prevDeaths = stats.deaths - 1;
    const prevKd = prevDeaths > 0 ? prevKills / prevDeaths : prevKills;

    kdChange = Number((currentKd - prevKd).toFixed(2));
    if (currentKd > prevKd + 0.01) {
      kdTrend = "up";
    } else if (currentKd < prevKd - 0.01) {
      kdTrend = "down";
    }
  }

  return {
    ...stats,
    kd: Number(currentKd.toFixed(2)),
    kdTrend,
    kdChange,
    lastMatchKills,
  };
}
