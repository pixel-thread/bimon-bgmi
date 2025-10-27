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
  const teamKills = data.players.reduce((acc, player) => acc + player.kills, 0);
  const teamDeaths = data.players.reduce(
    (acc, player) => acc + player.deaths,
    0,
  );

  return await prisma.$transaction(async (tx) => {
    // Upsert TeamStats for this team in this match
    await tx.teamStats.upsert({
      where: { teamId }, // If matchId + teamId unique, change to composite unique
      create: {
        teamId,
        matchId,
        tournamentId,
        seasonId,
      },
      update: {
        kills: { increment: teamKills },
        deaths: { increment: teamDeaths },
      },
    });

    // Update PlayerStats
    await Promise.all(
      data.players.map((player) =>
        tx.playerStats.update({
          where: { playerId: player.playerId },
          data: {
            kills: { increment: player.kills },
            deaths: { increment: player.deaths },
            wins: player.wins ?? undefined,
            win2nd: player.wind2nd ?? undefined,
          },
        }),
      ),
    );
    return { success: true };
  });
}
