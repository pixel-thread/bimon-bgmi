import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

const REFERRAL_COMMISSION = 5;

/**
 * POST /api/tournaments/[id]/undo-winner
 *
 * Full reversal of declare-winners:
 * 1. Reverse claimed rewards (deduct wallet + silent debit)
 * 2. Delete ALL PendingReward (WINNER + SOLO_SUPPORT + REFERRAL)
 * 3. Delete TournamentWinner records
 * 4. Delete Income records (Fund/Org)
 * 5. Undo referral commission increments
 * 6. Reset tournament → ACTIVE, isWinnerDeclared = false
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized — super admin only" }, { status: 403 });
        }

        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: { id: true, name: true, isWinnerDeclared: true },
        });
        if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        if (!tournament.isWinnerDeclared) return NextResponse.json({ error: "Winners not declared yet" }, { status: 400 });

        // Get all winning player IDs
        const winners = await prisma.tournamentWinner.findMany({
            where: { tournamentId: id },
            include: { team: { include: { players: { select: { id: true } } } } },
        });
        const winningTeamIds = winners.map(w => w.team.id);
        const winningPlayersFromStats = await prisma.teamPlayerStats.findMany({
            where: { teamId: { in: winningTeamIds } },
            select: { playerId: true },
            distinct: ["playerId"],
        });
        const winningPlayerIds = [
            ...new Set([
                ...winners.flatMap(w => w.team.players.map(p => p.id)),
                ...winningPlayersFromStats.map(p => p.playerId),
            ]),
        ];

        // Get all participants
        const allTeams = await prisma.team.findMany({
            where: { tournamentId: id },
            include: { players: { select: { id: true } } },
        });
        const allParticipantIds = [...new Set(allTeams.flatMap((t) => t.players.map((p) => p.id)))];

        // Get referrals that might have been incremented
        const referrals = await prisma.referral.findMany({
            where: { referredPlayerId: { in: allParticipantIds }, tournamentsCompleted: { gt: 0 } },
        });

        await prisma.$transaction(async (tx) => {
            // 1. Reverse claimed rewards (deduct from wallet silently)
            const claimedRewards = await tx.pendingReward.findMany({
                where: {
                    message: { contains: tournament.name },
                    type: { in: ["WINNER", "SOLO_SUPPORT"] },
                    isClaimed: true,
                },
            });
            for (const reward of claimedRewards) {
                await tx.wallet.update({
                    where: { playerId: reward.playerId },
                    data: { balance: { decrement: reward.amount } },
                });
                await tx.transaction.create({
                    data: {
                        playerId: reward.playerId,
                        amount: reward.amount,
                        type: "DEBIT",
                        description: `Adjustment - ${tournament.name}`,
                    },
                });
            }

            // 2. Delete ALL rewards for this tournament (claimed + unclaimed)
            await tx.pendingReward.deleteMany({
                where: {
                    message: { contains: tournament.name },
                    type: { in: ["WINNER", "SOLO_SUPPORT"] },
                },
            });

            // 3. Delete TournamentWinner records
            await tx.tournamentWinner.deleteMany({ where: { tournamentId: id } });

            // 4. Delete Income records (Fund/Org)
            await tx.income.deleteMany({ where: { tournamentId: id } });

            // 4b. Delete winner notifications for this tournament
            await tx.notification.deleteMany({
                where: {
                    type: "tournament",
                    message: { contains: tournament.name },
                    playerId: { in: winningPlayerIds },
                },
            });

            // 5. Undo referral tournament count increments
            for (const ref of referrals) {
                if (ref.tournamentsCompleted >= 5 && (ref.status === "PAID" || ref.status === "QUALIFIED")) {
                    await tx.referral.update({
                        where: { id: ref.id },
                        data: {
                            tournamentsCompleted: ref.tournamentsCompleted - 1,
                            status: "PENDING",
                            paidAt: null,
                        },
                    });
                    if (ref.status === "PAID") {
                        await tx.user.update({
                            where: { id: ref.promoterId },
                            data: { promoterEarnings: { decrement: REFERRAL_COMMISSION } },
                        });
                        const promoterPlayer = await tx.player.findFirst({
                            where: { userId: ref.promoterId },
                            select: { id: true },
                        });
                        if (promoterPlayer) {
                            await tx.pendingReward.deleteMany({
                                where: {
                                    playerId: promoterPlayer.id,
                                    type: "REFERRAL",
                                    isClaimed: false,
                                },
                            });
                        }
                    }
                } else {
                    await tx.referral.update({
                        where: { id: ref.id },
                        data: { tournamentsCompleted: { decrement: 1 } },
                    });
                }
            }

            // 6. Reset tournament
            await tx.tournament.update({
                where: { id },
                data: { isWinnerDeclared: false, status: "ACTIVE" },
            });
        }, { timeout: 60000, maxWait: 65000 });

        return NextResponse.json({
            success: true,
            message: "Winner declaration fully undone",
            data: {
                winnersDeleted: winners.length,
                playersAffected: winningPlayerIds.length,
                participantsProcessed: allParticipantIds.length,
                referralsUndone: referrals.length,
            },
        });
    } catch (error) {
        console.error("Error undoing winner declaration:", error);
        return NextResponse.json({ error: "Failed to undo" }, { status: 500 });
    }
}
