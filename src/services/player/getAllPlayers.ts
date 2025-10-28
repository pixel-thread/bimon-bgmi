import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PlayerWhereInput;
  include: Prisma.PlayerInclude;
};
export async function getAllPlayers({ where, include }: Props) {
  return await prisma.player.findMany({
    where,
    include,
    orderBy: { playerStats: { createdAt: "desc" } },
  });
}
