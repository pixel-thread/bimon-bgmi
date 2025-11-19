import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.TeamStatsCreateInput;
};

export async function createTeamStats({ data }: Props) {
  return await prisma.teamStats.create({ data });
}
