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
    const isBanned = isPlayerExist?.isBanned;

    // Bans are now fully admin-controlled (no auto-ban based on balance)
    return await tx.player.update({
      where,
      data: {
        isBanned: !isBanned,
      },
    });
  });
}
