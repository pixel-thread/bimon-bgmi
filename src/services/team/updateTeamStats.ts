import { prisma } from "@/src/lib/db/prisma";
import { logger } from "@/src/utils/logger";
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

    logger.log("TeamPlayerStats updated");

    return { success: true };
  });
}

export async function updateManyTeamsStats({
  stats,
  tournamentId,
  matchId,
  seasonId,
}: TeamsStatsSchemaT & { seasonId: string | null }) {
  // Use a single transaction for all updates - MUCH faster than individual transactions
  await prisma.$transaction(async (tx) => {
    // Collect all unique player IDs for batch recalculation at the end
    const allPlayerIds = new Set<string>();

    // Process all teams in parallel within the same transaction
    await Promise.all(
      stats.map(async (stat) => {
        // Upsert TeamStats for this team
        const teamStats = await tx.teamStats.upsert({
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
        });

        // Process all players for this team in parallel
        await Promise.all(
          stat.players.map(async (player) => {
            allPlayerIds.add(player.playerId);

            // Upsert TeamPlayerStats
            await tx.teamPlayerStats.upsert({
              where: {
                playerId_teamId_matchId: {
                  playerId: player.playerId,
                  teamId: stat.teamId,
                  matchId,
                },
              },
              create: {
                playerId: player.playerId,
                teamId: stat.teamId,
                matchId,
                seasonId: seasonId || "",
                teamStatsId: teamStats.id,
                kills: player.kills ?? 0,
                deaths: 1,
              },
              update: {
                kills: player.kills ?? 0,
                deaths: 1,
              },
            });
          })
        );
      })
    );

    // Batch recalculate PlayerStats for all affected players at once
    // This is more efficient than doing it per-player inside the loop
    await Promise.all(
      Array.from(allPlayerIds).map(async (playerId) => {
        const allPlayerStats = await tx.teamPlayerStats.findMany({
          where: {
            playerId,
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
        const uniqueMatches = new Set(allPlayerStats.map((s) => s.matchId));
        const totalDeaths = uniqueMatches.size;

        await tx.playerStats.upsert({
          where: {
            seasonId_playerId: {
              playerId,
              seasonId: seasonId || "",
            },
          },
          create: {
            playerId,
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

    logger.log("Bulk TeamPlayerStats updated");
  });
}
