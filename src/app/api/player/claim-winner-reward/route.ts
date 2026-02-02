import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * POST /api/player/claim-winner-reward
 * 
 * Claim the pending winner reward from a tournament placement.
 * This is called when the player clicks "Claim" on the winner celebration banner.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user.playerId) {
            return ErrorResponse({ message: "Player not found" });
        }

        // Get player with pending winner reward
        const player = await prisma.player.findUnique({
            where: { id: user.playerId },
            select: {
                id: true,
                userId: true,
                pendingWinnerReward: true,
                pendingWinnerPosition: true,
                pendingWinnerTournament: true,
            },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found" });
        }

        if (!player.pendingWinnerReward || player.pendingWinnerReward <= 0) {
            return ErrorResponse({ message: "No pending winner reward to claim" });
        }

        const rewardAmount = player.pendingWinnerReward;
        const position = player.pendingWinnerPosition || 1;
        const tournamentName = player.pendingWinnerTournament || "Tournament";

        // Transfer UC, create transaction record, and clear pending reward
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
                    description: `🏆 ${getOrdinal(position)} Place Prize: ${tournamentName}`,
                },
            }),
            // Clear the pending winner reward fields
            prisma.player.update({
                where: { id: player.id },
                data: {
                    pendingWinnerReward: null,
                    pendingWinnerPosition: null,
                    pendingWinnerTournament: null,
                    pendingWinnerDetails: Prisma.DbNull,
                },
            }),
        ]);

        return SuccessResponse({
            message: `Congratulations! ${rewardAmount} UC has been added to your balance!`,
            data: {
                rewardAmount,
                position,
                tournamentName,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
