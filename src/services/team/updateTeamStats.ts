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
  return await prisma.$transaction(
    async (tx) => {
      // Upsert TeamStats for this team in this match
      await tx.teamStats.upsert({
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
        },
        update: { position: data.position },
      });
      await Promise.all(
        data.players.map((player) =>
          tx.teamPlayerStats.update({
            where: {
              playerId_teamId_matchId: {
                playerId: player.playerId,
                teamId,
                matchId,
              },
            },
            data: {
              kills: player.kills ?? 0,
              deaths: player.deaths ?? 0,
            },
          }),
        ),
      );
      logger.log("TeamPlayerStats updated");
      // Update PlayerStats
      await Promise.all(
        data.players.map((player) =>
          tx.playerStats.update({
            where: {
              seasonId_playerId: {
                playerId: player.playerId,
                seasonId: seasonId || "",
              },
            },
            data: {
              kills: player.kills ?? 0,
              deaths: 1, // player should be dead  1  for a single match in a team
            },
          }),
        ),
      );

      return { success: true };
    },
    {
      maxWait: 20000,
      timeout: 30000,
    },
  );
}

export async function updateManyTeamsStats({
  stats,
  tournamentId,
  matchId,
}: TeamsStatsSchemaT & { seasonId: string | null }) {
  for (const stat of stats) {
    await updateTeamStats({
      teamId: stat.teamId,
      matchId,
      tournamentId,
      data: stat,
    });
  }
}
