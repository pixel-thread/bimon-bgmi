import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * Undo tournament winner declaration.
 * This will:
 * 1. Reset isWinnerDeclared to false
 * 2. Reverse UC balances for all winning players
 * 3. Delete transaction records for this tournament
 * 4. Delete TournamentWinner records
 * 5. Delete Income records (Fund/Org)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await superAdminMiddleware(req);
        const tournamentId = (await params).id;

        const tournament = await getTournamentById({ id: tournamentId });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found" });
        }

        if (!tournament.isWinnerDeclared) {
            return ErrorResponse({ message: "Tournament winner has not been declared yet" });
        }

        // Get all tournament winners with their teams and players
        const tournamentWinners = await prisma.tournamentWinner.findMany({
            where: { tournamentId },
            include: {
                team: {
                    include: {
                        players: {
                            include: { user: true },
                        },
                    },
                },
            },
        });

        // Calculate how much each player received based on the winner amounts
        const playerDeductions: Map<string, number> = new Map();

        for (const winner of tournamentWinners) {
            if (winner.isDistributed && winner.team.players.length > 0) {
                // Find the transactions for this tournament to get exact amounts
                for (const player of winner.team.players) {
                    const transactions = await prisma.transaction.findMany({
                        where: {
                            playerId: player.id,
                            description: { contains: tournament.name },
                            type: "credit",
                        },
                    });

                    const totalCredited = transactions.reduce((sum, t) => sum + t.amount, 0);
                    if (totalCredited > 0) {
                        playerDeductions.set(player.id, (playerDeductions.get(player.id) || 0) + totalCredited);
                    }
                }
            }
        }

        // Start transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Reverse UC balances for each player
            for (const [playerId, amount] of playerDeductions) {
                await tx.uC.updateMany({
                    where: { playerId },
                    data: { balance: { decrement: amount } },
                });
            }

            // 2. Delete transaction records for this tournament
            await tx.transaction.deleteMany({
                where: {
                    description: { contains: tournament.name },
                    type: "credit",
                },
            });

            // 3. Delete TournamentWinner records
            await tx.tournamentWinner.deleteMany({
                where: { tournamentId },
            });

            // 4. Delete Income records (Fund/Org) for this tournament
            await tx.income.deleteMany({
                where: { tournamentId },
            });

            // 5. Reset isWinnerDeclared to false
            await tx.tournament.update({
                where: { id: tournamentId },
                data: { isWinnerDeclared: false },
            });
        });

        return SuccessResponse({
            message: "Tournament winner declaration has been undone successfully",
            data: {
                playersAffected: playerDeductions.size,
                totalUCReversed: Array.from(playerDeductions.values()).reduce((a, b) => a + b, 0),
                winnersDeleted: tournamentWinners.length,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
