import { prisma } from "@/src/lib/db/prisma";

type Props = {
  tournamentId: string;
};

export async function getTeamByTournamentId({ tournamentId }: Props) {
  return await prisma.team.findMany({
    where: { tournamentId },
    include: {
      matches: true,
      teamStats: { include: { match: true } },
      players: { include: { user: true, playerStats: true } },
    },
  });
}
