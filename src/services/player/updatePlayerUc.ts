import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.UCWhereUniqueInput;
  update: Prisma.UCUpdateInput;
  data: Prisma.UCCreateInput;
};

export async function updatePlayerUc({ where, update }: Props) {
  return await prisma.$transaction(async (tx) => {
    const isPlayerExist = await tx.player.findUnique({
      where: { id: where.playerId },
      include: { user: true },
    });

    if (!isPlayerExist) throw new Error("Player not found");

    let isPlayerUc = await tx.uC.findUnique({
      where,
      include: { user: true },
    });

    if (!isPlayerUc && isPlayerExist) {
      await tx.uC.create({
        data: {
          balance: 0,
          user: { connect: { id: isPlayerExist.user.id } },
          player: { connect: { id: isPlayerExist.id } },
        },
      });
    }

    return await tx.uC.update({
      where: { playerId: where.playerId },
      data: {
        balance: update.balance,
      },
    });
  });
}
