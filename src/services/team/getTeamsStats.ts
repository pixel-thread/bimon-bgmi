import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.TeamStatsWhereInput;
  orderBy?: Prisma.TeamStatsOrderByWithRelationInput;
};

export async function getTeamsStats({ where, orderBy }: Props) {
  return await prisma.teamStats.findMany({
    where,
    include: {
      team: {
        include: { matches: true, players: { include: { user: true } } },
      },
    },
    orderBy,
  });
}
