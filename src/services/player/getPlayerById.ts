import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};
export async function getPlayerById({ id }: Props) {
  return prisma.player.findUnique({
    where: { id },
    include: { characterImage: true, user: true, playerStats: true },
  });
}
