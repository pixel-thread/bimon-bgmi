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
  // ULTRA-OPTIMIZED: Use raw SQL batch operations to reduce ~150 queries to 3 queries
  // This prevents timeout issues on Vercel's free tier (10s limit)

  const safeSeasonId = seasonId || "";

  await prisma.$transaction(async (tx) => {
    // Collect all data upfront
    const allPlayerIds: string[] = [];
    const teamStatsData: Array<{ teamId: string; position: number }> = [];
    const playerStatsData: Array<{ playerId: string; teamId: string; kills: number }> = [];

    stats.forEach((stat) => {
      teamStatsData.push({ teamId: stat.teamId, position: stat.position ?? 0 });
      stat.players.forEach((player) => {
        allPlayerIds.push(player.playerId);
        playerStatsData.push({
          playerId: player.playerId,
          teamId: stat.teamId,
          kills: player.kills ?? 0,
        });
      });
    });

    // STEP 1: Batch upsert TeamStats using raw SQL (1 query for all teams)
    // Uses gen_random_uuid() for PostgreSQL to generate IDs
    if (teamStatsData.length > 0) {
      const teamValues = teamStatsData.map(
        (t) => `(gen_random_uuid(), '${t.teamId}', '${matchId}', '${tournamentId}', '${safeSeasonId}', ${t.position}, NOW(), NOW())`
      ).join(", ");

      await tx.$executeRawUnsafe(`
        INSERT INTO "TeamStats" ("id", "teamId", "matchId", "tournamentId", "seasonId", "position", "createdAt", "updatedAt")
        VALUES ${teamValues}
        ON CONFLICT ("teamId", "matchId") 
        DO UPDATE SET "position" = EXCLUDED."position", "updatedAt" = NOW()
      `);
    }

    // Get all teamStats IDs for the player stats foreign key
    const teamStatsRecords = await tx.teamStats.findMany({
      where: { matchId, teamId: { in: teamStatsData.map(t => t.teamId) } },
      select: { id: true, teamId: true },
    });
    const teamStatsMap = new Map(teamStatsRecords.map(ts => [ts.teamId, ts.id]));

    // STEP 2: Batch upsert TeamPlayerStats using raw SQL (1 query for all players)
    if (playerStatsData.length > 0) {
      const playerValues = playerStatsData.map((p) => {
        const teamStatsId = teamStatsMap.get(p.teamId) || '';
        return `(gen_random_uuid(), '${p.playerId}', '${p.teamId}', '${matchId}', '${safeSeasonId}', '${teamStatsId}', ${p.kills}, 1, NOW(), NOW())`;
      }).join(", ");

      await tx.$executeRawUnsafe(`
        INSERT INTO "TeamPlayerStats" ("id", "playerId", "teamId", "matchId", "seasonId", "teamStatsId", "kills", "deaths", "createdAt", "updatedAt")
        VALUES ${playerValues}
        ON CONFLICT ("playerId", "teamId", "matchId") 
        DO UPDATE SET "kills" = EXCLUDED."kills", "deaths" = EXCLUDED."deaths", "updatedAt" = NOW()
      `);
    }

    // STEP 3: Recalculate PlayerStats using aggregated query + batch upsert
    if (allPlayerIds.length > 0) {
      // Get aggregated totals for all affected players
      const playerTotals = await tx.teamPlayerStats.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: allPlayerIds },
          seasonId: safeSeasonId,
        },
        _sum: { kills: true },
        _count: { matchId: true },
      });

      if (playerTotals.length > 0) {
        const statsValues = playerTotals.map(
          (pt) => `(gen_random_uuid(), '${pt.playerId}', '${safeSeasonId}', ${pt._sum.kills ?? 0}, ${pt._count.matchId}, NOW(), NOW())`
        ).join(", ");

        await tx.$executeRawUnsafe(`
          INSERT INTO "PlayerStats" ("id", "playerId", "seasonId", "kills", "deaths", "createdAt", "updatedAt")
          VALUES ${statsValues}
          ON CONFLICT ("playerId", "seasonId") 
          DO UPDATE SET "kills" = EXCLUDED."kills", "deaths" = EXCLUDED."deaths", "updatedAt" = NOW()
        `);
      }
    }
  }, {
    timeout: 10000, // 10 seconds - much safer now with only 3-4 queries
    maxWait: 2000,
  });
}

