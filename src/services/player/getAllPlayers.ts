import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getPagination } from "@/src/utils/pagination";

type Props = {
  where: Prisma.PlayerWhereInput;
  include?: Prisma.PlayerInclude;
  page?: string;
  orderBy?: Prisma.SortOrder;
};

export async function getAllPlayers({ where, page = "1", orderBy }: Props) {
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
          uc: true,
        },
        orderBy: { [orderBy || "createdAt"]: "desc" },
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
          uc: true,
        },
        take,
        skip,
        orderBy: { [orderBy || "createdAt"]: "desc" },
      }),

      prisma.player.count({ where }),
    ]);
  }
}
