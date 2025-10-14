import { prisma } from "@/src/lib/db/prisma";

type Props = {
  tournamentId: string;
};

export async function getTeamByTournamentId({ tournamentId }: Props) {
  return prisma.team.findMany({
    where: { tournamentId },
    include: { players: { include: { playerStats: true, user: true } } },
  });
}
