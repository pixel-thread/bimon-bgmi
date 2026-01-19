import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  seasonId?: string;
};

// Helper function to get extended stats (seasons, tournaments, best match, podium, ban status, wins, top10, UC placements)
async function getExtendedStats(playerId: string) {
  // Get player with relations for seasons, teams, ban status, and UC distribution placements
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      isBanned: true,
      seasons: { select: { id: true } },
      teams: {
        select: {
          id: true,
          tournamentId: true,
          teamStats: {
            select: { position: true, matchId: true },
          },
          tournamentWinner: {
            select: { position: true },
          },
        },
      },
      playerBanned: {
        select: {
          banReason: true,
          banDuration: true,
          bannedAt: true,
        },
      },
    },
  });

  if (!player) {
    return {
      seasonsPlayed: 0,
      totalTournaments: 0,
      bestMatchKills: 0,
      podiumFinishes: { first: 0, second: 0, third: 0 },
      ucPlacements: { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
      banStatus: { isBanned: false },
      wins: 0,
      top10Count: 0,
      winRate: 0,
      top10Rate: 0,
      avgKillsPerMatch: 0,
    };
  }

  // Count seasons played
  const seasonsPlayed = player.seasons.length;

  // Count unique tournaments
  const uniqueTournaments = new Set(
    player.teams.map((t) => t.tournamentId).filter(Boolean)
  );
  const totalTournaments = uniqueTournaments.size;

  // Get best match (highest kills) and calculate avg kills
  const allMatchStats = await prisma.teamPlayerStats.findMany({
    where: { playerId },
    select: { kills: true },
    orderBy: { kills: "desc" },
  });
  const bestMatchKills = allMatchStats[0]?.kills || 0;
  const totalKillsFromMatches = allMatchStats.reduce((sum, m) => sum + m.kills, 0);
  const totalMatchesPlayed = allMatchStats.length;
  const avgKillsPerMatch = totalMatchesPlayed > 0
    ? Number((totalKillsFromMatches / totalMatchesPlayed).toFixed(2))
    : 0;

  // Count podium finishes, wins, and top 10 (from team positions)
  const podiumFinishes = { first: 0, second: 0, third: 0 };
  let wins = 0;
  let top10Count = 0;

  // Use Set to avoid counting same match multiple times
  const countedMatches = new Set<string>();

  for (const team of player.teams) {
    for (const stat of team.teamStats) {
      if (countedMatches.has(stat.matchId)) continue;
      countedMatches.add(stat.matchId);

      if (stat.position === 1) {
        podiumFinishes.first++;
        wins++;
        top10Count++;
      } else if (stat.position === 2) {
        podiumFinishes.second++;
        top10Count++;
      } else if (stat.position === 3) {
        podiumFinishes.third++;
        top10Count++;
      } else if (stat.position <= 10 && stat.position > 0) {
        top10Count++;
      }
    }
  }

  // Count UC distribution placements from tournament winners (1st, 2nd, 3rd, 4th, 5th in tournament standings)
  const ucPlacements = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
  for (const team of player.teams) {
    // Each team can have at most one tournamentWinner entry
    for (const winner of team.tournamentWinner) {
      if (winner.position === 1) {
        ucPlacements.first++;
      } else if (winner.position === 2) {
        ucPlacements.second++;
      } else if (winner.position === 3) {
        ucPlacements.third++;
      } else if (winner.position === 4) {
        ucPlacements.fourth++;
      } else if (winner.position === 5) {
        ucPlacements.fifth++;
      }
    }
  }

  // Calculate rates
  const winRate = totalMatchesPlayed > 0
    ? Number(((wins / totalMatchesPlayed) * 100).toFixed(1))
    : 0;
  const top10Rate = totalMatchesPlayed > 0
    ? Number(((top10Count / totalMatchesPlayed) * 100).toFixed(1))
    : 0;

  // Ban status
  const banStatus = {
    isBanned: player.isBanned,
    reason: player.playerBanned?.banReason || undefined,
    duration: player.playerBanned?.banDuration || undefined,
    bannedAt: player.playerBanned?.bannedAt || undefined,
  };

  return {
    seasonsPlayed,
    totalTournaments,
    bestMatchKills,
    podiumFinishes,
    ucPlacements,
    banStatus,
    wins,
    top10Count,
    winRate,
    top10Rate,
    avgKillsPerMatch,
  };
}

export async function getPlayerStatsByPlayerId({ playerId, seasonId }: Props) {
  // Get extended stats (runs in parallel with other queries)
  const extendedStatsPromise = getExtendedStats(playerId);

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

    // Wait for extended stats
    const extendedStats = await extendedStatsPromise;

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
      ...extendedStats,
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

  // Wait for extended stats
  const extendedStats = await extendedStatsPromise;

  return {
    ...stats,
    kd: Number(currentKd.toFixed(2)),
    kdTrend,
    kdChange,
    lastMatchKills,
    ...extendedStats,
  };
}
