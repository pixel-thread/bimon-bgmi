import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.MatchWhereUniqueInput;
};

export async function deleteMatch({ where }: Props) {
  return await prisma.$transaction(async (tx) => {
    // Get all TeamPlayerStats for this match to know which players to update
    const teamPlayerStats = await tx.teamPlayerStats.findMany({
      where: { matchId: where.id },
      select: { playerId: true, seasonId: true, kills: true },
    });

    // Decrement kills and deaths for each player in PlayerStats
    for (const stat of teamPlayerStats) {
      await tx.playerStats.updateMany({
        where: {
          playerId: stat.playerId,
          seasonId: stat.seasonId,
        },
        data: {
          kills: { decrement: stat.kills },  // Remove kills from this match
          deaths: { decrement: 1 },          // Remove 1 death
        },
      });
    }

    // Delete match-related stats
    await tx.teamStats.deleteMany({ where: { matchId: where.id } });
    await tx.teamPlayerStats.deleteMany({ where: { matchId: where.id } });
    await tx.matchPlayerPlayed.deleteMany({ where: { matchId: where.id } });

    const match = await tx.match.findUnique({ where: { id: where.id } });
    const matches = await tx.match.findMany({
      where: { tournamentId: match?.tournamentId },
    });

    if (matches.length === 1) {
      await tx.team.deleteMany({
        where: { tournamentId: match?.tournamentId },
      });
    }

    return await tx.match.delete({ where });
  });
}
