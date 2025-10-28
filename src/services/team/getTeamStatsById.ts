import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.TeamStatsWhereUniqueInput;
  include: Prisma.TeamStatsInclude;
};

export async function getTeamStats({ where, include }: Props) {
  return await prisma.teamStats.findUnique({ where, include });
}
