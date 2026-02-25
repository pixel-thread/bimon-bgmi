import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/rewards/[id]/claim
 * Claims a pending reward — credits wallet and marks as claimed.
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const reward = await prisma.pendingReward.findUnique({
            where: { id },
        });

        if (!reward) {
            return ErrorResponse({ message: "Reward not found", status: 404 });
        }

        if (reward.playerId !== user.player.id) {
            return ErrorResponse({ message: "Not your reward", status: 403 });
        }

        if (reward.isClaimed) {
            return ErrorResponse({ message: "Reward already claimed", status: 400 });
        }

        // Atomic: credit wallet + mark claimed
        await prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { playerId: user.player!.id },
                data: { balance: { increment: reward.amount } },
            });

            await tx.pendingReward.update({
                where: { id },
                data: { isClaimed: true, claimedAt: new Date() },
            });

            // Create transaction record
            const rewardLabels: Record<string, string> = {
                WINNER: "Prize",
                SOLO_SUPPORT: "Solo Support",
                REFERRAL: "Referral Bonus",
                STREAK: "Streak Reward",
            };
            const label = rewardLabels[reward.type] || reward.type;

            await tx.transaction.create({
                data: {
                    playerId: user.player!.id,
                    amount: reward.amount,
                    type: "CREDIT",
                    description: `${label}: ${reward.message || "Reward claimed"}`,
                },
            });
        });

        return SuccessResponse({
            message: "Reward claimed!",
            data: { rewardId: id, amount: reward.amount },
        });
    } catch (error) {
        console.error("Error claiming reward:", error);
        return ErrorResponse({ message: "Failed to claim reward" });
    }
}
