import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.TournamentWinnerWhereInput;
};

export async function getTournamentWinners({ where }: Props) {
  return prisma.tournamentWinner.findMany({
    where,
    include: { team: { include: { players: { include: { user: true } } } } },
  });
}
