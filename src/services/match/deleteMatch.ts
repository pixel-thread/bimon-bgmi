import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.MatchWhereUniqueInput;
};

export async function deleteMatch({ where }: Props) {
  return await prisma.$transaction(async (tx) => {
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
