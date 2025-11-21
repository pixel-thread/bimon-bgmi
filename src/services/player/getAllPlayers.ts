import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getPagination } from "@/src/utils/pagination";

type Props = {
  where: Prisma.PlayerWhereInput;
  include?: Prisma.PlayerInclude;
  page?: string;
};
export async function getAllPlayers({ where, page = "1" }: Props) {
  const { take, skip } = getPagination({ page });

  if (page === "all") {
    return await prisma.$transaction([
      prisma.player.findMany({
        where,
        include: {
          playerStats: { include: { matches: true } },
          user: true,
          matches: true,
          matchPlayerPlayed: true,
        },
      }),

      prisma.player.count({ where }),
    ]);
  } else {
    return await prisma.$transaction([
      prisma.player.findMany({
        where,
        include: {
          playerStats: { include: { matches: true } },
          user: true,
          matches: true,
          matchPlayerPlayed: true,
        },
        take,
        skip,
      }),

      prisma.player.count({ where }),
    ]);
  }
}
