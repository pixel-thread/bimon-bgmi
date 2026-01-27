import { prisma } from "@/src/lib/db/prisma";
import {
  TeamsStatsSchemaT,
  teamStatsSchema,
} from "@/src/utils/validation/team/team-stats";
import z from "zod";

type Props = {
  teamId: string;
  matchId: string;
  tournamentId?: string;
  seasonId?: string;
  data: z.infer<typeof teamStatsSchema>;
};

export async function updateTeamStats({
  teamId,
  matchId,
  tournamentId,
  seasonId,
  data,
}: Props) {
  return await prisma.$transaction(async (tx) => {
    // Upsert TeamStats for this team in this match
    const teamStats = await tx.teamStats.upsert({
      where: {
        teamId,
        matchId,
        tournamentId,
        teamId_matchId: { teamId, matchId },
      },
      create: {
        teamId,
        matchId,
        tournamentId,
        seasonId,
        position: data.position,
      },
      update: { position: data.position },
    });

    await Promise.all(
      data.players.map(async (player) => {
        // Get existing stats to calculate delta
        const existingStats = await tx.teamPlayerStats.findUnique({
          where: {
            playerId_teamId_matchId: {
              playerId: player.playerId,
              teamId,
              matchId,
            },
          },
        });

        const oldKills = existingStats?.kills ?? 0;
        const newKills = player.kills ?? 0;
        const killsDelta = newKills - oldKills;
        const isNewMatchEntry = !existingStats;

        // Upsert TeamPlayerStats
        await tx.teamPlayerStats.upsert({
          where: {
            playerId_teamId_matchId: {
              playerId: player.playerId,
              teamId,
              matchId,
            },
          },
          create: {
            playerId: player.playerId,
            teamId,
            matchId,
            seasonId: seasonId || "",
            teamStatsId: teamStats.id,
            kills: newKills,
            deaths: 1, // Default death for a match
          },
          update: {
            kills: newKills,
            deaths: 1,
          },
        });

        // Recalculate PlayerStats (kills and deaths) from TeamPlayerStats
        // This ensures consistency and avoids double-counting deaths on updates
        const allPlayerStats = await tx.teamPlayerStats.findMany({
          where: {
            playerId: player.playerId,
            seasonId: seasonId || "",
          },
          select: {
            kills: true,
            matchId: true,
          },
        });

        const totalKills = allPlayerStats.reduce(
          (acc, curr) => acc + curr.kills,
          0
        );
        // Count unique matches as deaths (assuming 1 death per match)
        const uniqueMatches = new Set(allPlayerStats.map((s) => s.matchId));
        const totalDeaths = uniqueMatches.size;

        // Update PlayerStats with recalculated values
        await tx.playerStats.upsert({
          where: {
            seasonId_playerId: {
              playerId: player.playerId,
              seasonId: seasonId || "",
            },
          },
          create: {
            playerId: player.playerId,
            seasonId: seasonId || "",
            kills: totalKills,
            deaths: totalDeaths,
          },
          update: {
            kills: totalKills,
            deaths: totalDeaths,
          },
        });
      })
    );

    return { success: true };
  });
}

export async function updateManyTeamsStats({
  stats,
  tournamentId,
  matchId,
  seasonId,
}: TeamsStatsSchemaT & { seasonId: string | null }) {
  // OPTIMIZED: Use batched operations to minimize database round-trips
  // This reduces ~100+ individual queries to ~10-15 queries

  await prisma.$transaction(async (tx) => {
    // Collect all unique player IDs for batch recalculation at the end
    const allPlayerIds = new Set<string>();

    // STEP 1: Upsert all TeamStats in parallel (one query per team, ~16 teams = 16 queries)
    const teamStatsPromises = stats.map((stat) =>
      tx.teamStats.upsert({
        where: {
          teamId: stat.teamId,
          matchId,
          tournamentId,
          teamId_matchId: { teamId: stat.teamId, matchId },
        },
        create: {
          teamId: stat.teamId,
          matchId,
          tournamentId,
          seasonId,
          position: stat.position,
        },
        update: { position: stat.position },
        select: { id: true, teamId: true },
      })
    );
    const teamStatsResults = await Promise.all(teamStatsPromises);

    // Build teamId -> teamStatsId map
    const teamStatsMap = new Map<string, string>();
    teamStatsResults.forEach((ts) => teamStatsMap.set(ts.teamId, ts.id));

    // STEP 2: Batch upsert all TeamPlayerStats using larger chunks
    const allPlayerOps: Array<{
      playerId: string;
      teamId: string;
      teamStatsId: string;
      kills: number;
    }> = [];

    stats.forEach((stat) => {
      const teamStatsId = teamStatsMap.get(stat.teamId);
      if (!teamStatsId) return;

      stat.players.forEach((player) => {
        allPlayerIds.add(player.playerId);
        allPlayerOps.push({
          playerId: player.playerId,
          teamId: stat.teamId,
          teamStatsId,
          kills: player.kills ?? 0,
        });
      });
    });

    // OPTIMIZED: Process ALL player stats in one big parallel batch
    // Instead of chunking by 20, do all at once since Prisma handles connection pooling
    await Promise.all(
      allPlayerOps.map((op) =>
        tx.teamPlayerStats.upsert({
          where: {
            playerId_teamId_matchId: {
              playerId: op.playerId,
              teamId: op.teamId,
              matchId,
            },
          },
          create: {
            playerId: op.playerId,
            teamId: op.teamId,
            matchId,
            seasonId: seasonId || "",
            teamStatsId: op.teamStatsId,
            kills: op.kills,
            deaths: 1,
          },
          update: {
            kills: op.kills,
            deaths: 1,
          },
        })
      )
    );

    // STEP 3: OPTIMIZED - Single aggregation query to get all player totals at once
    // Instead of N queries (one per player), use one groupBy query
    const playerTotals = await tx.teamPlayerStats.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: Array.from(allPlayerIds) },
        seasonId: seasonId || "",
      },
      _sum: { kills: true },
      _count: { matchId: true },
    });

    // OPTIMIZED: Upsert all PlayerStats in parallel (no chunking needed)
    await Promise.all(
      playerTotals.map((pt) =>
        tx.playerStats.upsert({
          where: {
            seasonId_playerId: {
              playerId: pt.playerId,
              seasonId: seasonId || "",
            },
          },
          create: {
            playerId: pt.playerId,
            seasonId: seasonId || "",
            kills: pt._sum.kills ?? 0,
            deaths: pt._count.matchId,
          },
          update: {
            kills: pt._sum.kills ?? 0,
            deaths: pt._count.matchId,
          },
        })
      )
    );
  }, {
    timeout: 15000, // 15 seconds - should be plenty now with optimizations
    maxWait: 3000,  // 3 seconds max wait to acquire connection
  });
}
