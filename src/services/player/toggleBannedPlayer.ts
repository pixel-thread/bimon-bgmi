import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PlayerWhereUniqueInput;
};
export async function toggleBannedPlayer({ where }: Props) {
  return await prisma.$transaction(async (tx) => {
    const isPlayerExist = await tx.player.findUnique({
      where,
    });
    return await tx.player.update({
      where,
      data: {
        isBanned: isPlayerExist?.isBanned ? false : true,
      },
    });
  });
}
