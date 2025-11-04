import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.PlayerStatsCreateManyInput[];
  where: Prisma.PlayerStatsWhereInput;
};
export async function updatePlayerStats({ data, where }: Props) {
  return await prisma.playerStats.updateMany({
    where: where,
    data: data,
  });
}
