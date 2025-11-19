import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.TeamStatsWhereInput;
};

export async function getTeamStats({ where }: Props) {
  return await prisma.teamStats.findFirst({
    where,
    include: {
      teamPlayerStats: { include: { player: { include: { user: true } } } },
    },
  });
}
