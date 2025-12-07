import { prisma } from "@/src/lib/db/prisma";

type PlayerAmount = {
    playerId: string;
    amount: number;
};

type Props = {
    tournamentId: string;
    playerAmounts: PlayerAmount[];
};

export async function distributeWinnerUC({ tournamentId, playerAmounts }: Props) {
    return prisma.$transaction(async (tx) => {
        // Get tournament and its winners
        const tournament = await tx.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, name: true },
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        const winners = await tx.tournamentWinner.findMany({
            where: { tournamentId },
            include: {
                team: {
                    include: {
                        players: { include: { user: true } },
                    },
                },
            },
        });

        if (winners.length === 0) {
            throw new Error("No winners found for this tournament");
        }

        // Check if already distributed
        const alreadyDistributed = winners.some((w) => w.isDistributed);
        if (alreadyDistributed) {
            throw new Error("UC has already been distributed for this tournament");
        }

        // Get all player IDs from winning teams
        const validPlayerIds = new Set(
            winners.flatMap((w) => w.team.players.map((p) => p.id))
        );

        // Calculate total amount per winner (for record keeping)
        const winnerTotals = new Map<string, number>();

        // Distribute UC to each player
        for (const { playerId, amount } of playerAmounts) {
            if (!validPlayerIds.has(playerId)) {
                continue; // Skip invalid player IDs
            }

            if (amount <= 0) continue;

            // Get player info
            const player = await tx.player.findUnique({
                where: { id: playerId },
                include: { user: true },
            });

            if (!player) continue;

            // Update or create UC balance
            await tx.uC.upsert({
                where: { playerId: player.id },
                create: {
                    player: { connect: { id: player.id } },
                    user: { connect: { id: player.user.id } },
                    balance: amount,
                },
                update: { balance: { increment: amount } },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    amount: amount,
                    type: "credit",
                    description: `Tournament Prize: ${tournament.name}`,
                    playerId: player.id,
                },
            });

            // Track totals for winner records
            const winner = winners.find((w) =>
                w.team.players.some((p) => p.id === playerId)
            );
            if (winner) {
                winnerTotals.set(
                    winner.id,
                    (winnerTotals.get(winner.id) || 0) + amount
                );
            }
        }

        // Update all winners with total amounts and mark as distributed
        const updatedWinners = [];
        for (const winner of winners) {
            const totalAmount = winnerTotals.get(winner.id) || 0;
            const updatedWinner = await tx.tournamentWinner.update({
                where: { id: winner.id },
                data: {
                    amount: totalAmount,
                    isDistributed: true,
                },
            });
            updatedWinners.push(updatedWinner);
        }

        return updatedWinners;
    });
}

