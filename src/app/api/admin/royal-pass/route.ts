import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { RP_PRICE } from "@/src/lib/royal-pass/config";

/**
 * GET /api/admin/royal-pass - Get Royal Pass statistics
 * Super admin only
 */
export async function GET(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true, name: true, startDate: true },
        });

        // Get all Royal Pass subscriptions with player and season info
        const royalPasses = await prisma.royalPass.findMany({
            include: {
                player: {
                    include: {
                        user: { select: { displayName: true, userName: true } },
                    },
                },
                season: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate bonus earned for each subscriber (from RP Safety Net transactions)
        const subscribersWithBonus = await Promise.all(
            royalPasses.map(async (rp) => {
                const bonusTransactions = await prisma.transaction.findMany({
                    where: {
                        playerId: rp.playerId,
                        description: { contains: "RP Safety Net" },
                        timestamp: { gte: rp.season.id === activeSeason?.id ? activeSeason?.startDate : rp.createdAt },
                    },
                });
                const totalBonus = bonusTransactions.reduce((sum, t) => sum + t.amount, 0);

                return {
                    id: rp.id,
                    playerName: rp.player.user.displayName || rp.player.user.userName,
                    playerId: rp.playerId,
                    seasonName: rp.season.name,
                    seasonId: rp.seasonId,
                    isActive: rp.isActive,
                    subscribedAt: rp.createdAt.toISOString(),
                    expiresAt: rp.expiresAt?.toISOString() || null,
                    bonusEarned: totalBonus,
                };
            })
        );

        // Calculate summary stats
        const totalSubscribers = royalPasses.length;
        const activeSubscribers = royalPasses.filter((rp) => rp.isActive).length;
        const currentSeasonSubscribers = activeSeason
            ? royalPasses.filter((rp) => rp.seasonId === activeSeason.id).length
            : 0;
        const totalUCCollected = totalSubscribers * RP_PRICE;
        const totalBonusPaid = subscribersWithBonus.reduce((sum, s) => sum + s.bonusEarned, 0);

        return SuccessResponse({
            data: {
                summary: {
                    totalSubscribers,
                    activeSubscribers,
                    currentSeasonSubscribers,
                    totalUCCollected,
                    totalBonusPaid,
                    rpPrice: RP_PRICE,
                    currentSeasonName: activeSeason?.name || null,
                },
                subscribers: subscribersWithBonus,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
