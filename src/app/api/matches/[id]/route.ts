import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * DELETE /api/matches/[id]
 *
 * - Match #1 → Full tournament reset (delete ALL matches, teams, stats,
 *   refund entry fees, reactivate poll, set tournament ACTIVE).
 * - Any other match → Delete only that match (cascade via schema).
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const { id } = await params;

        const match = await prisma.match.findUnique({
            where: { id },
            select: { id: true, matchNumber: true, tournamentId: true },
        });

        if (!match) return ErrorResponse({ message: "Match not found", status: 404 });

        // ── Match #1 → Full tournament reset ──────────────────────
        if (match.matchNumber === 1) {
            const tournamentId = match.tournamentId;

            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                select: {
                    name: true,
                    matches: { select: { id: true, matchNumber: true } },
                    poll: { select: { id: true } },
                },
            });

            if (!tournament) {
                return ErrorResponse({ message: "Tournament not found", status: 404 });
            }

            // Find entry fee debit transactions to refund
            const entryFeeTransactions = await prisma.transaction.findMany({
                where: {
                    type: "DEBIT",
                    description: { contains: tournament.name },
                },
                select: { id: true, playerId: true, amount: true, description: true },
            });

            await prisma.$transaction(
                async (tx) => {
                    // 1. Delete TournamentWinners
                    await tx.tournamentWinner.deleteMany({ where: { tournamentId } });

                    // 2. Delete MatchPlayerPlayed
                    await tx.matchPlayerPlayed.deleteMany({ where: { tournamentId } });

                    // 3. Delete TeamPlayerStats for all matches
                    for (const m of tournament.matches) {
                        await tx.teamPlayerStats.deleteMany({ where: { matchId: m.id } });
                    }

                    // 4. Delete TeamStats
                    await tx.teamStats.deleteMany({ where: { tournamentId } });

                    // 5. Delete all Matches
                    await tx.match.deleteMany({ where: { tournamentId } });

                    // 6. Delete all Teams
                    await tx.team.deleteMany({ where: { tournamentId } });

                    // 7. Reverse entry fees (no trace)
                    if (entryFeeTransactions.length > 0) {
                        const refundsByPlayer = new Map<string, number>();
                        for (const txn of entryFeeTransactions) {
                            refundsByPlayer.set(
                                txn.playerId,
                                (refundsByPlayer.get(txn.playerId) || 0) + txn.amount,
                            );
                        }

                        for (const [playerId, amount] of refundsByPlayer) {
                            await tx.wallet.update({
                                where: { playerId },
                                data: { balance: { increment: amount } },
                            });
                        }

                        // Delete original debit transactions — clean slate
                        await tx.transaction.deleteMany({
                            where: { id: { in: entryFeeTransactions.map((t) => t.id) } },
                        });
                    }

                    // 8. Reset tournament flags
                    await tx.tournament.update({
                        where: { id: tournamentId },
                        data: {
                            isWinnerDeclared: false,
                            status: "ACTIVE",
                        },
                    });

                    // 9. Reactivate the poll
                    if (tournament.poll) {
                        await tx.poll.update({
                            where: { id: tournament.poll.id },
                            data: { isActive: true },
                        });
                    }
                },
                { maxWait: 30000, timeout: 120000 },
            );

            const refundTotal = entryFeeTransactions.reduce((s, t) => s + t.amount, 0);
            return SuccessResponse({
                message: `Tournament fully reset! Deleted ${tournament.matches.length} match(es), all teams & stats.${refundTotal > 0 ? ` Refunded ${refundTotal} UC.` : ""} Poll reactivated.`,
            });
        }

        // ── Any other match → normal single-match delete ─────────
        await prisma.match.delete({ where: { id } });

        return SuccessResponse({ message: `Match #${match.matchNumber} deleted` });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete match", error });
    }
}
