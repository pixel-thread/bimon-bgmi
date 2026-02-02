import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { STREAK_REWARD_THRESHOLD } from "@/src/services/player/tournamentStreak";

/**
 * POST /api/player/claim-streak-reward
 * 
 * Claim the pending streak reward (30 UC for 8 consecutive tournaments).
 * This is called when the player clicks the "Claim" button on the celebration banner.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user.playerId) {
            return ErrorResponse({ message: "Player not found" });
        }

        // Get player with pending reward
        const player = await prisma.player.findUnique({
            where: { id: user.playerId },
            select: {
                id: true,
                userId: true,
                pendingStreakReward: true,
            },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found" });
        }

        if (!player.pendingStreakReward || player.pendingStreakReward <= 0) {
            return ErrorResponse({ message: "No pending streak reward to claim" });
        }

        const rewardAmount = player.pendingStreakReward;

        // Transfer UC and clear pending reward in a transaction
        await prisma.$transaction([
            // Credit UC
            prisma.uC.upsert({
                where: { playerId: player.id },
                create: {
                    playerId: player.id,
                    userId: player.userId!,
                    balance: rewardAmount,
                },
                update: { balance: { increment: rewardAmount } },
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    playerId: player.id,
                    amount: rewardAmount,
                    type: "credit",
                    description: `🔥 ${STREAK_REWARD_THRESHOLD}-Tournament Streak Bonus!`,
                },
            }),
            // Clear the pending reward
            prisma.player.update({
                where: { id: player.id },
                data: {
                    pendingStreakReward: null,
                },
            }),
        ]);

        return SuccessResponse({
            message: `Congratulations! ${rewardAmount} UC has been added to your balance!`,
            data: {
                rewardAmount,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
