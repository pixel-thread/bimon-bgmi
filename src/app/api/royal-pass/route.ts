import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { getPlayerStreakInfo, STREAK_REWARD_AMOUNT, STREAK_REWARD_THRESHOLD } from "@/src/services/player/tournamentStreak";

const FREE_RP_LIMIT = 5; // First 5 purchases are free

/**
 * GET /api/royal-pass - Get current user's rewards status (streak and balance)
 */
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get player from user
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get player's UC balance
        const uc = await prisma.uC.findUnique({
            where: { playerId: player.id },
        });

        // Get streak info
        const streakInfo = await getPlayerStreakInfo(player.id);

        // Get total RP claim count for free offer
        const totalRPClaimed = await prisma.royalPass.count();
        const freeSlotsRemaining = Math.max(0, FREE_RP_LIMIT - totalRPClaimed);
        const isFreeOffer = freeSlotsRemaining > 0;

        // Check if current player already has RP
        const hasRoyalPass = await prisma.royalPass.findFirst({
            where: { playerId: player.id },
        });

        // Non-RP holders with streak >= 8 lose the 50% discount
        const lostDiscount = !hasRoyalPass && streakInfo.currentStreak >= STREAK_REWARD_THRESHOLD;

        return SuccessResponse({
            data: {
                currentBalance: uc?.balance ?? 0,
                hasRoyalPass: !!hasRoyalPass,
                lostDiscount, // True if non-RP holder hit 8 streak - must pay full price
                // Free offer info
                freeOffer: {
                    isActive: isFreeOffer,
                    claimed: totalRPClaimed,
                    total: FREE_RP_LIMIT,
                    remaining: freeSlotsRemaining,
                },
                // Streak info
                streak: {
                    current: streakInfo.currentStreak,
                    progress: streakInfo.progressToReward,
                    tournamentsUntilReward: streakInfo.tournamentsUntilReward,
                    rewardThreshold: STREAK_REWARD_THRESHOLD,
                    rewardAmount: STREAK_REWARD_AMOUNT,
                    lastRewardAt: streakInfo.lastRewardAt,
                },
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
