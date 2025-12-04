import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  id: string;
};

export async function getPlayerById({ id }: Props) {
  return await prisma.player.findUnique({
    where: { id },
    include: { characterImage: true, user: true, uc: true, matchPlayerPlayed: true, playerBanned: true },
  });
}
