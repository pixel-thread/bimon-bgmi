import { prisma } from "@/src/lib/db/prisma";
import { clearPlayerStatusOnBalanceRecovery } from "@/src/services/player/balanceRecovery";

type Props = {
  teamId: string;
  playerId: string;
  tournamentName?: string;
  entryFee?: number;
};

export async function removePlayerFromTeam({ teamId, playerId, tournamentName, entryFee }: Props) {
  return await prisma.$transaction(async (tx) => {
    // Get team to find seasonId for recalculating stats
    const team = await tx.team.findUnique({
      where: { id: teamId },
      select: { seasonId: true },
    });

    await tx.teamPlayerStats.deleteMany({
      where: { playerId, teamId },
    });

    await tx.matchPlayerPlayed.deleteMany({
      where: { playerId: playerId, teamId: teamId },
    });

    // Recalculate PlayerStats based on remaining TeamPlayerStats
    // This ensures kills/deaths are updated after removing from team
    const remainingStats = await tx.teamPlayerStats.findMany({
      where: {
        playerId,
        seasonId: team?.seasonId || "",
      },
      select: {
        kills: true,
        matchId: true,
      },
    });

    const totalKills = remainingStats.reduce(
      (acc, curr) => acc + curr.kills,
      0
    );
    const uniqueMatches = new Set(remainingStats.map((s) => s.matchId));
    const totalDeaths = uniqueMatches.size;

    // Update PlayerStats with recalculated values
    await tx.playerStats.upsert({
      where: {
        seasonId_playerId: {
          playerId,
          seasonId: team?.seasonId || "",
        },
      },
      create: {
        playerId,
        seasonId: team?.seasonId || "",
        kills: totalKills,
        deaths: totalDeaths,
      },
      update: {
        kills: totalKills,
        deaths: totalDeaths,
      },
    });

    // Check if player paid entry fee and issue refund
    let refundIssued = false;
    if (tournamentName && entryFee && entryFee > 0) {
      // Look for the entry fee debit transaction
      const entryFeeTransaction = await tx.transaction.findFirst({
        where: {
          playerId,
          type: "debit",
          description: `Entry fee for ${tournamentName}`,
        },
      });

      if (entryFeeTransaction) {
        // Get player's current UC balance
        const player = await tx.player.findUnique({
          where: { id: playerId },
          select: { userId: true, uc: { select: { balance: true } } },
        });

        const currentBalance = player?.uc?.balance || 0;
        const newBalance = currentBalance + entryFee;

        // Create refund transaction
        await tx.transaction.create({
          data: {
            amount: entryFee,
            type: "credit",
            description: `Entry fee refund for ${tournamentName}`,
            playerId,
          },
        });

        // Update UC balance
        await tx.uC.upsert({
          where: { playerId },
          create: {
            balance: newBalance,
            player: { connect: { id: playerId } },
            user: { connect: { id: player?.userId || "" } },
          },
          update: { balance: newBalance },
        });

        // Clear trusted status if balance recovered
        await clearPlayerStatusOnBalanceRecovery(playerId, newBalance, tx);

        refundIssued = true;
      }
    }

    const updatedTeam = await tx.team.update({
      where: { id: teamId },
      data: { players: { disconnect: { id: playerId } } },
    });

    return { ...updatedTeam, refundIssued, refundAmount: refundIssued ? entryFee : 0 };
  });
}
