import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { STREAK_REWARD_AMOUNT, STREAK_REWARD_THRESHOLD } from "@/src/services/player/tournamentStreak";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

const FREE_RP_LIMIT = 5; // First 5 purchases are free

/**
 * GET /api/royal-pass - Get current user's rewards status (streak, balance, pending rewards)
 * 
 * OPTIMIZED: Combined multiple queries into parallel execution and a single player query
 */
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Run independent queries in parallel
        const [player, activeSeason, totalRPClaimed] = await Promise.all([
            // Single query for player with ALL needed fields (including UC, royal pass, and streak data)
            prisma.player.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    // Streak fields
                    tournamentStreak: true,
                    streakSeasonId: true,
                    lastStreakRewardAt: true,
                    pendingStreakReward: true,
                    // Pending reward fields
                    pendingWinnerReward: true,
                    pendingWinnerPosition: true,
                    pendingWinnerTournament: true,
                    pendingWinnerDetails: true,
                    pendingSoloSupport: true,
                    pendingSoloSupportMsg: true,
                    pendingReferralBonus: true,
                    pendingReferralMsg: true,
                    // Include UC and RoyalPass in same query
                    uc: {
                        select: { balance: true },
                    },
                    royalPasses: {
                        select: { id: true, seasonId: true },
                    },
                },
            }),
            // Active season for streak calculation
            prisma.season.findFirst({
                where: { status: "ACTIVE" },
                select: { id: true },
            }),
            // Total RP count for free offer
            prisma.royalPass.count(),
        ]);

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const hasRoyalPass = player.royalPasses.length > 0;
        // Check if player has RP for the current active season
        const currentSeasonId = activeSeason?.id ?? null;
        const hasCurrentSeasonRoyalPass = currentSeasonId
            ? player.royalPasses.some(rp => rp.seasonId === currentSeasonId)
            : hasRoyalPass; // If no active season, fall back to hasRoyalPass
        const effectiveStreak = (currentSeasonId && player.streakSeasonId !== currentSeasonId)
            ? 0
            : player.tournamentStreak;
        const progress = effectiveStreak % STREAK_REWARD_THRESHOLD;

        // Free offer calculations
        const freeSlotsRemaining = Math.max(0, FREE_RP_LIMIT - totalRPClaimed);
        const isFreeOffer = freeSlotsRemaining > 0;

        // Non-RP holders with streak >= 8 lose the 50% discount
        const lostDiscount = !hasRoyalPass && effectiveStreak >= STREAK_REWARD_THRESHOLD;

        return SuccessResponse({
            data: {
                currentBalance: player.uc?.balance ?? 0,
                hasRoyalPass,
                hasCurrentSeasonRoyalPass,
                lostDiscount,
                // Free offer info
                freeOffer: {
                    isActive: isFreeOffer,
                    claimed: totalRPClaimed,
                    total: FREE_RP_LIMIT,
                    remaining: freeSlotsRemaining,
                },
                // Streak info
                streak: {
                    current: effectiveStreak,
                    progress: progress,
                    tournamentsUntilReward: STREAK_REWARD_THRESHOLD - progress,
                    rewardThreshold: STREAK_REWARD_THRESHOLD,
                    rewardAmount: STREAK_REWARD_AMOUNT,
                    lastRewardAt: player.lastStreakRewardAt,
                    pendingReward: player.pendingStreakReward,
                },
                // Pending winner reward info (for claim banner)
                pendingWinner: player.pendingWinnerReward ? {
                    amount: player.pendingWinnerReward,
                    position: player.pendingWinnerPosition,
                    tournament: player.pendingWinnerTournament,
                    details: player.pendingWinnerDetails as Prisma.JsonObject | null,
                } : null,
                // Pending solo support (for claim banner)
                pendingSoloSupport: player.pendingSoloSupport ? {
                    amount: player.pendingSoloSupport,
                    message: player.pendingSoloSupportMsg,
                } : null,
                // Pending referral bonus (for claim banner)
                pendingReferralBonus: player.pendingReferralBonus ? {
                    amount: player.pendingReferralBonus,
                    message: player.pendingReferralMsg,
                } : null,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
