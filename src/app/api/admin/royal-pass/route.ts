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

        // Get all Royal Pass purchases with player info
        const royalPasses = await prisma.royalPass.findMany({
            include: {
                player: {
                    include: {
                        user: { select: { displayName: true, userName: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Map to response format
        const subscribers = royalPasses.map((rp, index) => ({
            id: rp.id,
            playerName: rp.player.user.displayName || rp.player.user.userName,
            playerId: rp.playerId,
            amount: rp.amount,
            displayValue: rp.displayValue,
            pricePaid: rp.pricePaid,
            wasFree: rp.amount === 0,
            purchasedAt: rp.createdAt.toISOString(),
        }));

        // Calculate summary stats
        const totalPurchases = royalPasses.length;
        const freePurchases = royalPasses.filter(rp => rp.amount === 0).length;
        const paidPurchases = royalPasses.filter(rp => rp.amount > 0).length;
        const totalUCCollected = royalPasses.reduce((sum, rp) => sum + rp.amount, 0);
        const freeSlotsRemaining = Math.max(0, FREE_RP_LIMIT - totalPurchases);

        return SuccessResponse({
            data: {
                summary: {
                    totalPurchases,
                    freePurchases,
                    paidPurchases,
                    totalUCCollected,
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
