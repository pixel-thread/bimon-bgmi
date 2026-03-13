import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { creditCentralWallet } from "@/lib/wallet-service";

/**
 * POST /api/rewards/[id]/claim
 * Claims a pending reward — credits wallet and marks as claimed.
 * The wallet service handles central vs local routing.
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthEmail();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { email: userId },
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

        const rewardLabels: Record<string, string> = {
            WINNER: "Prize",
            SOLO_SUPPORT: "Solo Support",
            REFERRAL: "Referral Bonus",
            STREAK: "Streak Reward",
        };
        const label = rewardLabels[reward.type] || reward.type;
        const description = `${label}: ${reward.message || "Reward claimed"}`;

        const reasonMap: Record<string, string> = {
            WINNER: "TOURNAMENT_WIN",
            SOLO_SUPPORT: "SOLO_SUPPORT",
            REFERRAL: "REFERRAL_BONUS",
            STREAK: "STREAK_BONUS",
        };
        const reason = reasonMap[reward.type] || "OTHER";

        // Credit wallet (service handles central vs local routing)
        await creditCentralWallet(userId, reward.amount, description, reason);

        // Mark as claimed
        await prisma.pendingReward.update({
            where: { id },
            data: { isClaimed: true, claimedAt: new Date() },
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
