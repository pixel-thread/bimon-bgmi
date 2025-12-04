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

        // Update PlayerStats with delta and deaths
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
            kills: newKills,
            deaths: 1, // First match = 1 death
          },
          update: {
            kills: { increment: killsDelta },
            // Increment deaths only if this is a new match entry for the player
            deaths: isNewMatchEntry ? { increment: 1 } : undefined,
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
  for (const stat of stats) {
    await updateTeamStats({
      teamId: stat.teamId,
      matchId,
      tournamentId,
      data: stat,
      seasonId: seasonId || undefined,
    });
  }
}
