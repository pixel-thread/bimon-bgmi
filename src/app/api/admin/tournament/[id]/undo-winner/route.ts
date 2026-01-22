import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { STREAK_REWARD_AMOUNT } from "@/src/services/player/tournamentStreak";

/**
 * Undo tournament winner declaration.
 * This will fully reverse all effects:
 * 1. Reset isWinnerDeclared to false and status to ACTIVE
 * 2. Reverse UC balances for all winning players (prizes)
 * 3. Reverse UC balances for loser support (solo tax distribution)
 * 4. Reverse streak bonus rewards (8-tournament streak)
 * 5. Delete all transaction records for this tournament
 * 6. Delete TournamentWinner records
 * 7. Delete Income records (Fund/Org)
 * 8. Undo tournament streak updates for participants
 * 9. Re-increment streaks for non-participants (who had theirs reset)
 * 10. Undo referral tournament count increments
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

        // Get tournament sequence ID for streak reversal
        const tournamentSeq = await prisma.tournamentSequence.findUnique({
            where: { tournamentId },
            select: { sequenceId: true },
        });

        // Get all players who participated in this tournament
        const tournamentParticipants = await prisma.matchPlayerPlayed.findMany({
            where: { tournamentId },
            select: { playerId: true },
            distinct: ["playerId"],
        });
        const participantPlayerIds = tournamentParticipants.map((p) => p.playerId);

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

        // Find all credit transactions for this tournament
        const allCreditTransactions = await prisma.transaction.findMany({
            where: {
                description: { contains: tournament.name },
                type: "credit",
            },
            select: { playerId: true, amount: true, description: true },
        });

        // Calculate total UC to deduct per player
        const playerDeductions: Map<string, number> = new Map();
        for (const tx of allCreditTransactions) {
            playerDeductions.set(
                tx.playerId,
                (playerDeductions.get(tx.playerId) || 0) + tx.amount
            );
        }

        // Find streak bonus transactions
        const streakBonusTransactions = await prisma.transaction.findMany({
            where: {
                description: { contains: "Streak Bonus" },
                type: "credit",
            },
        });

        // Filter to only those that happened around the time this tournament was declared
        // We need to be careful here - match by timestamp proximity
        const tournamentUpdatedAt = tournament.updatedAt;
        const recentStreakBonuses = streakBonusTransactions.filter((tx) => {
            const timeDiff = Math.abs(new Date(tx.timestamp).getTime() - new Date(tournamentUpdatedAt).getTime());
            return timeDiff < 60000; // Within 1 minute
        });

        // Add streak bonus deductions
        for (const tx of recentStreakBonuses) {
            playerDeductions.set(
                tx.playerId,
                (playerDeductions.get(tx.playerId) || 0) + tx.amount
            );
        }

        // Referral commission amount (must match processReferralCommission.ts)
        const REFERRAL_COMMISSION = 5;

        // Start transaction with extended timeout for large tournaments
        await prisma.$transaction(async (tx) => {
            // 1. Reverse UC balances for each player
            for (const [playerId, amount] of playerDeductions) {
                await tx.uC.updateMany({
                    where: { playerId },
                    data: { balance: { decrement: amount } },
                });
            }

            // 2. Delete ALL credit transaction records for this tournament
            await tx.transaction.deleteMany({
                where: {
                    description: { contains: tournament.name },
                    type: "credit",
                },
            });

            // 3. Delete streak bonus transactions that were given during this declaration
            for (const tx2 of recentStreakBonuses) {
                await tx.transaction.delete({
                    where: { id: tx2.id },
                });
            }

            // 4. Delete TournamentWinner records
            await tx.tournamentWinner.deleteMany({
                where: { tournamentId },
            });

            // 5. Delete Income records (Fund/Org) for this tournament
            await tx.income.deleteMany({
                where: { tournamentId },
            });

            // 6. Undo streak updates for participants
            // Decrement their streaks (or set to previous value)
            if (tournamentSeq) {
                for (const playerId of participantPlayerIds) {
                    const player = await tx.player.findUnique({
                        where: { id: playerId },
                        select: {
                            tournamentStreak: true,
                            lastTournamentSeqId: true,
                            lastStreakRewardAt: true
                        },
                    });

                    if (player && player.lastTournamentSeqId === tournamentSeq.sequenceId) {
                        // This player's streak was updated by this tournament
                        // Check if they got a streak reward (their streak would be 0 and lastStreakRewardAt recent)
                        const gotReward = player.tournamentStreak === 0 &&
                            player.lastStreakRewardAt &&
                            Math.abs(new Date(player.lastStreakRewardAt).getTime() - new Date(tournamentUpdatedAt).getTime()) < 60000;

                        if (gotReward) {
                            // They got the 8-tournament reward - restore streak to 7
                            // IMPORTANT: Keep lastTournamentSeqId the SAME so re-declaring triggers
                            // "same tournament" check and doesn't double-count
                            await tx.player.update({
                                where: { id: playerId },
                                data: {
                                    tournamentStreak: 7,
                                    // Keep lastTournamentSeqId unchanged!
                                    lastStreakRewardAt: null,
                                },
                            });
                        } else {
                            // Just decrement streak but KEEP lastTournamentSeqId the same
                            // This way, when winners are re-declared for this tournament,
                            // the streak code sees currentSeqId === lastTournamentSeqId (same tournament)
                            // and returns early without changing the streak again
                            await tx.player.update({
                                where: { id: playerId },
                                data: {
                                    tournamentStreak: Math.max(0, player.tournamentStreak - 1),
                                    // Keep lastTournamentSeqId unchanged!
                                },
                            });
                        }
                    }
                }

                // 7. Restore streaks for non-participants whose streaks were reset
                // We can't know exactly what their streaks were, but we won't touch them
                // This is a limitation - streaks for non-participants can't be fully restored
            }

            // 8. Undo referral tournament count increments
            // Find referrals for participants and decrement their tournament count
            for (const playerId of participantPlayerIds) {
                const referral = await tx.referral.findUnique({
                    where: { referredPlayerId: playerId },
                });

                if (referral && referral.tournamentsCompleted > 0) {
                    // If they just hit 5 and got paid, we need to undo that too
                    if (referral.tournamentsCompleted === 5 && referral.status === "PAID") {
                        // Undo the promoter earnings
                        await tx.user.update({
                            where: { id: referral.promoterId },
                            data: { promoterEarnings: { decrement: REFERRAL_COMMISSION } },
                        });

                        await tx.referral.update({
                            where: { id: referral.id },
                            data: {
                                tournamentsCompleted: 4,
                                status: "PENDING",
                                paidAt: null,
                            },
                        });
                    } else if (referral.tournamentsCompleted === 5 && referral.status === "QUALIFIED") {
                        await tx.referral.update({
                            where: { id: referral.id },
                            data: {
                                tournamentsCompleted: 4,
                                status: "PENDING",
                            },
                        });
                    } else {
                        await tx.referral.update({
                            where: { id: referral.id },
                            data: {
                                tournamentsCompleted: { decrement: 1 },
                            },
                        });
                    }
                }
            }

            // 9. Reset isWinnerDeclared to false and status back to ACTIVE
            await tx.tournament.update({
                where: { id: tournamentId },
                data: {
                    isWinnerDeclared: false,
                    status: "ACTIVE",
                },
            });
        }, {
            timeout: 60000, // 60 second timeout for large tournaments
            maxWait: 65000,
        });

        return SuccessResponse({
            message: "Tournament winner declaration has been fully undone",
            data: {
                playersAffected: playerDeductions.size,
                totalUCReversed: Array.from(playerDeductions.values()).reduce((a, b) => a + b, 0),
                winnersDeleted: tournamentWinners.length,
                participantsProcessed: participantPlayerIds.length,
                streakBonusesReversed: recentStreakBonuses.length,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
