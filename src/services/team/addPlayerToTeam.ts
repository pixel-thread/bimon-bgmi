import { prisma } from "@/src/lib/db/prisma";

type Props = {
  teamId: string;
  matchId: string;
  playerId: string;
};
export async function addPlayerToTeam({ teamId, playerId, matchId }: Props) {
  return await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: teamId } });

    await tx.team.update({
      where: { id: teamId },
      data: { players: { connect: { id: playerId } } },
    });

    let teamStat = await tx.teamStats.findFirst({
      where: {
        teamId: teamId,
        matchId: matchId,
      },
    });

    if (!teamStat) {
      teamStat = await tx.teamStats.create({
        data: {
          teamId: teamId,
          matchId: matchId,
          seasonId: team?.seasonId,
          tournamentId: team?.tournamentId,
        },
      });
    }

    await tx.player.update({
      where: { id: playerId },
      data: {
        teamStats: { connect: { id: teamStat.id || "" } },
      },
    });

    await tx.teamPlayerStats.create({
      data: {
        teamId: teamId || "",
        matchId: matchId || "",
        seasonId: team?.seasonId || "",
        playerId: playerId || "",
        teamStatsId: teamStat.id || "",
      },
    });

    await tx.matchPlayerPlayed.create({
      data: {
        matchId: matchId || "",
        playerId: playerId || "",
        tournamentId: team?.tournamentId || "",
        seasonId: team?.seasonId || "",
        teamId: team?.id || "",
      },
    });
    return team;
  });
}
