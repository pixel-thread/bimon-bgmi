import { prisma } from "@/src/lib/db/prisma";
import { clearPlayerStatusOnBalanceRecovery } from "@/src/services/player/balanceRecovery";

type Props = {
  id: string;
  refund?: boolean;
  tournamentName?: string;
  entryFee?: number;
};

export async function deleteTeamById({ id, refund = false, tournamentName, entryFee }: Props) {
  return await prisma.$transaction(async (tx) => {
    // Get team with players before deletion
    const team = await tx.team.findUnique({
      where: { id },
      include: { players: { select: { id: true, userId: true, uc: { select: { balance: true } } } } },
    });

    let refundedCount = 0;
    let refundedAmount = 0;

    // Issue refunds if requested
    if (refund && tournamentName && entryFee && entryFee > 0 && team?.players) {
      for (const player of team.players) {
        // Check if player paid entry fee for this tournament
        const entryFeeTransaction = await tx.transaction.findFirst({
          where: {
            playerId: player.id,
            type: "debit",
            description: `Entry fee for ${tournamentName}`,
          },
        });

        if (entryFeeTransaction) {
          const currentBalance = player.uc?.balance || 0;
          const newBalance = currentBalance + entryFee;

          // Create refund transaction
          await tx.transaction.create({
            data: {
              amount: entryFee,
              type: "credit",
              description: `Entry fee refund for ${tournamentName} (team deleted)`,
              playerId: player.id,
            },
          });

          // Update UC balance
          await tx.uC.upsert({
            where: { playerId: player.id },
            create: {
              balance: newBalance,
              player: { connect: { id: player.id } },
              user: { connect: { id: player.userId } },
            },
            update: { balance: newBalance },
          });

          // Clear trusted status if balance recovered
          await clearPlayerStatusOnBalanceRecovery(player.id, newBalance, tx);

          refundedCount++;
          refundedAmount += entryFee;
        }
      }
    }

    await tx.teamPlayerStats.deleteMany({ where: { teamId: id } });

    await tx.teamStats.deleteMany({ where: { teamId: id } });

    const deletedTeam = await tx.team.delete({ where: { id } });

    return { ...deletedTeam, refundedCount, refundedAmount };
  });
}
