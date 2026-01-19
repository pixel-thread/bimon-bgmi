import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

const RP_PRICE = 5; // Current RP price
const FREE_RP_LIMIT = 5; // First 5 are free

/**
 * GET /api/admin/royal-pass - Get Royal Pass statistics
 * Super admin only
 */
export async function GET(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        // Get current active season
        const activeSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true },
        });
        const currentSeasonId = activeSeason?.id;

        // Get all Royal Pass purchases with player info
        const royalPasses = await prisma.royalPass.findMany({
            include: {
                player: {
                    select: {
                        id: true,
                        tournamentStreak: true,
                        streakSeasonId: true,
                        user: { select: { displayName: true, userName: true } },
                        // Get streak bonus transactions
                        transactions: {
                            where: {
                                description: { contains: "Streak Bonus" },
                            },
                            select: { amount: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Map to response format with effective streak calculation
        const subscribers = royalPasses.map((rp) => {
            // If season changed, show streak as 0
            const effectiveStreak = (currentSeasonId && rp.player.streakSeasonId !== currentSeasonId)
                ? 0
                : rp.player.tournamentStreak;

            // Sum up all streak bonus UC earned
            const streakUCEarned = rp.player.transactions.reduce((sum, t) => sum + t.amount, 0);

            return {
                id: rp.id,
                playerName: rp.player.user.displayName || rp.player.user.userName,
                playerId: rp.playerId,
                amount: rp.amount,
                displayValue: rp.displayValue,
                pricePaid: rp.pricePaid,
                wasFree: rp.amount === 0,
                purchasedAt: rp.createdAt.toISOString(),
                streak: effectiveStreak,
                streakUCEarned,
            };
        });

        // Calculate summary stats
        const totalPurchases = royalPasses.length;
        const freePurchases = royalPasses.filter(rp => rp.amount === 0).length;
        const paidPurchases = royalPasses.filter(rp => rp.amount > 0).length;
        const totalUCCollected = royalPasses.reduce((sum, rp) => sum + rp.amount, 0);
        const totalUCRewarded = subscribers.reduce((sum, sub) => sum + sub.streakUCEarned, 0);
        const freeSlotsRemaining = Math.max(0, FREE_RP_LIMIT - totalPurchases);

        return SuccessResponse({
            data: {
                summary: {
                    totalPurchases,
                    freePurchases,
                    paidPurchases,
                    totalUCCollected,
                    totalUCRewarded,
                    freeSlotsRemaining,
                    rpPrice: RP_PRICE,
                    freeLimit: FREE_RP_LIMIT,
                },
                subscribers,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
