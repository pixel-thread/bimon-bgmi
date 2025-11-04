import { prisma } from "@/src/lib/db/prisma";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";
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
  // Aggregate team stats from all players
  const teamKills = data.players?.reduce((acc, player) => {
    if (player.kills) return acc + player.kills;
    return acc + 0;
  }, 0);

  const teamDeaths = data.players.reduce((acc, player) => {
    if (player.deaths) return acc + player?.deaths;
    return acc + 0;
  }, 0);

  return await prisma.$transaction(async (tx) => {
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
      update: {
        kills: teamKills,
        deaths: teamDeaths,
        position: data.position,
      },
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
    console.log("TeamPlayerStats updated");
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
            deaths: player.deaths ?? 0,
            wins: player.wins ?? 0,
            win2nd: player.wind2nd ?? 0,
          },
        }),
      ),
    );

    return { success: true };
  });
}
