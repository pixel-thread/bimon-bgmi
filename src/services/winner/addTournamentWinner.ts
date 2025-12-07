import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.TournamentWinnerCreateInput;
};

export async function addTournamentWinner({ data }: Props) {
  return prisma.$transaction(async (tx) => {
    // Create winner record (without UC distribution)
    const winner = await tx.tournamentWinner.create({ data });

    // Mark tournament as winner declared
    const team = await tx.team.findUnique({
      where: { id: data.team.connect?.id },
      select: { tournamentId: true },
    });

    if (team?.tournamentId) {
      await tx.tournament.update({
        where: { id: team.tournamentId },
        data: { isWinnerDeclared: true },
      });
    }

    return winner;
  });
}

