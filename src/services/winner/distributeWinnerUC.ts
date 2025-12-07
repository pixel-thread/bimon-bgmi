import { prisma } from "@/src/lib/db/prisma";

type DistributePlacement = {
    position: number;
    amount: number;
};

type Props = {
    tournamentId: string;
    placements: DistributePlacement[];
};

export async function distributeWinnerUC({ tournamentId, placements }: Props) {
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

        const updatedWinners = [];

        for (const placement of placements) {
            const winner = winners.find((w) => w.position === placement.position);
            if (!winner) continue;

            const teamPlayers = winner.team.players;
            const amount = placement.amount;

            if (amount > 0 && teamPlayers.length > 0) {
                const splitAmount = Math.floor(amount / teamPlayers.length);

                for (const player of teamPlayers) {
                    // Update or create UC balance
                    await tx.uC.upsert({
                        where: { playerId: player.id },
                        create: {
                            player: { connect: { id: player.id } },
                            user: { connect: { id: player.user.id } },
                            balance: splitAmount,
                        },
                        update: { balance: { increment: splitAmount } },
                    });

                    // Create transaction record
                    await tx.transaction.create({
                        data: {
                            amount: splitAmount,
                            type: "credit",
                            description: `Tournament Prize: ${tournament.name}`,
                            playerId: player.id,
                        },
                    });
                }
            }

            // Update winner with amount and mark as distributed
            const updatedWinner = await tx.tournamentWinner.update({
                where: { id: winner.id },
                data: {
                    amount: amount,
                    isDistributed: true,
                },
            });

            updatedWinners.push(updatedWinner);
        }

        return updatedWinners;
    });
}
