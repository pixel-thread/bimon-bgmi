import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { checkAndApplyAutoBan } from "./autoBan";

type Props = {
  where: Prisma.UCWhereUniqueInput;
  update: Prisma.UCUpdateInput;
  data: Prisma.UCCreateInput;
};

export async function updatePlayerUc({
  where,
  update,
  transaction,
}: Props & {
  transaction?: {
    amount: number;
    type: "credit" | "debit";
    description: string;
  };
}) {
  return await prisma.$transaction(async (tx) => {
    const isPlayerExist = await tx.player.findUnique({
      where: { id: where.playerId },
      include: { user: true },
    });

    if (!isPlayerExist) throw new Error("Player not found");

    const isPlayerUc = await tx.uC.findUnique({
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

    if (transaction && where.playerId) {
      await tx.transaction.create({
        data: {
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          playerId: where.playerId,
        },
      });
    }

    const updatedUc = await tx.uC.update({
      where: { playerId: where.playerId },
      data: {
        balance: update.balance,
      },
    });

    if (where.playerId) {
      await checkAndApplyAutoBan(where.playerId, updatedUc.balance, tx);
    }

    return updatedUc;
  });
}
