import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/analytics/promoter-stats - Get promoter system statistics
 * Super admin only
 */
export async function GET(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        // Get all promoters with their stats
        const promoters = await prisma.user.findMany({
            where: { isPromoter: true },
            select: {
                id: true,
                userName: true,
                displayName: true,
                referralCode: true,
                promoterEarnings: true,
                createdAt: true,
                referralsGiven: {
                    select: {
                        id: true,
                        status: true,
                        tournamentsCompleted: true,
                        referredPlayer: {
                            include: {
                                user: { select: { displayName: true, userName: true } },
                            },
                        },
                        createdAt: true,
                    },
                },
            },
            orderBy: { promoterEarnings: "desc" },
        });

        // Calculate summary stats
        const totalPromoters = promoters.length;
        const totalReferrals = promoters.reduce(
            (acc, p) => acc + p.referralsGiven.length,
            0
        );
        const totalEarnings = promoters.reduce(
            (acc, p) => acc + p.promoterEarnings,
            0
        );
        const qualifiedReferrals = promoters.reduce(
            (acc, p) =>
                acc +
                p.referralsGiven.filter(
                    (r) => r.status === "QUALIFIED" || r.status === "PAID"
                ).length,
            0
        );
        const pendingReferrals = promoters.reduce(
            (acc, p) =>
                acc + p.referralsGiven.filter((r) => r.status === "PENDING").length,
            0
        );

        // Format for response
        const formattedPromoters = promoters.map((p) => ({
            id: p.id,
            name: p.displayName || p.userName,
            referralCode: p.referralCode,
            earnings: p.promoterEarnings,
            totalReferrals: p.referralsGiven.length,
            pendingCount: p.referralsGiven.filter((r) => r.status === "PENDING")
                .length,
            paidCount: p.referralsGiven.filter((r) => r.status === "PAID").length,
            referrals: p.referralsGiven.map((r) => ({
                id: r.id,
                playerName:
                    r.referredPlayer.user.displayName || r.referredPlayer.user.userName,
                status: r.status,
                tournamentsCompleted: r.tournamentsCompleted,
                createdAt: r.createdAt.toISOString(),
            })),
        }));

        return SuccessResponse({
            data: {
                summary: {
                    totalPromoters,
                    totalReferrals,
                    totalEarnings,
                    qualifiedReferrals,
                    pendingReferrals,
                    averageReferralsPerPromoter:
                        totalPromoters > 0
                            ? Math.round((totalReferrals / totalPromoters) * 10) / 10
                            : 0,
                    conversionRate:
                        totalReferrals > 0
                            ? Math.round((qualifiedReferrals / totalReferrals) * 100)
                            : 0,
                },
                promoters: formattedPromoters,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
