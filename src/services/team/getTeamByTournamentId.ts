import { prisma } from "@/src/lib/db/prisma";
import { getPagination } from "@/src/utils/pagination";

type Props = {
  tournamentId: string;
  page?: string;
};

export async function getTeamByTournamentId({
  tournamentId,
  page = "all",
}: Props) {
  const { take, skip } = getPagination({ page });
  if (page === "all") {
    return await prisma.$transaction([
      prisma.team.findMany({
        where: { tournamentId },
        include: {
          teamPlayerStats: true,
          matches: true,
          teamStats: { include: { match: true } },
          players: { include: { user: true, playerStats: true } },
        },
      }),

      prisma.team.count({ where: { tournamentId } }),
    ]);
  } else {
    return await prisma.$transaction([
      prisma.team.findMany({
        where: { tournamentId },
        include: {
          matches: true,
          teamStats: { include: { match: true } },
          teamPlayerStats: true,
          players: { include: { user: true, playerStats: true } },
        },
        skip,
        take,
      }),

      prisma.team.count({ where: { tournamentId } }),
    ]);
  }
}
