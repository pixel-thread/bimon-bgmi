import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PlayerWhereInput;
};
export async function getAllPlayers(
  { where }: Props = {
    where: {},
  },
) {
  return await prisma.player.findMany({
    where,
    include: { user: true, playerStats: true, characterImage: true },
    orderBy: { playerStats: { createdAt: "desc" } },
  });
}
