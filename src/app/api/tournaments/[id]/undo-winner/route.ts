import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

const REFERRAL_COMMISSION = 5;

/**
 * POST /api/tournaments/[id]/undo-winner
 *
 * Full reversal of declare-winners:
 * 1. Delete TournamentWinner records
 * 2. Delete PendingReward (WINNER + SOLO_SUPPORT + REFERRAL related)
 * 3. Delete Income records (Fund/Org)
 * 4. Undo referral commission increments
 * 5. Reset tournament → ACTIVE, isWinnerDeclared = false
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
        // Get players from both _PlayerToTeam AND TeamPlayerStats (migrated data)
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

        // Get all participants in the tournament
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
            // 1. Delete pending winner rewards (unclaimed)
            if (winningPlayerIds.length > 0) {
                await tx.pendingReward.deleteMany({
                    where: {
                        playerId: { in: winningPlayerIds },
                        type: "WINNER",
                        isClaimed: false,
                    },
                });
            }

            // 2. Delete pending solo support rewards for this tournament
            await tx.pendingReward.deleteMany({
                where: {
                    type: "SOLO_SUPPORT",
                    isClaimed: false,
                    message: { contains: tournament.name },
                },
            });

            // 3. Delete TournamentWinner records
            await tx.tournamentWinner.deleteMany({ where: { tournamentId: id } });

            // 4. Delete Income records (Fund/Org)
            await tx.income.deleteMany({ where: { tournamentId: id } });

            // 5. Undo referral tournament count increments
            for (const ref of referrals) {
                if (ref.tournamentsCompleted >= 5 && (ref.status === "PAID" || ref.status === "QUALIFIED")) {
                    // Undo the pay/qualify
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
                        // Delete pending referral reward
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
