import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

const REFERRAL_COMMISSION = 20;
const REFERRAL_TOURNAMENTS_REQUIRED = 5;

/**
 * GET /api/dashboard/referrals
 * Admin view of all referrals in the system.
 * SUPER_ADMIN only.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const referrals = await prisma.referral.findMany({
            include: {
                promoter: {
                    select: {
                        id: true,
                        username: true,
                        imageUrl: true,
                        promoterEarnings: true,
                    },
                },
                referredPlayer: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { username: true, imageUrl: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const referralList = referrals.map((ref) => ({
            id: ref.id,
            promoter: {
                id: ref.promoter.id,
                username: ref.promoter.username,
                imageUrl: ref.promoter.imageUrl,
                totalEarnings: ref.promoter.promoterEarnings,
            },
            referred: {
                id: ref.referredPlayer.id,
                name: ref.referredPlayer.displayName || ref.referredPlayer.user?.username || "Unknown",
                username: ref.referredPlayer.user?.username || "",
                imageUrl: ref.referredPlayer.user?.imageUrl || null,
            },
            tournamentsCompleted: ref.tournamentsCompleted,
            tournamentsRequired: REFERRAL_TOURNAMENTS_REQUIRED,
            progress: Math.min(Math.round((ref.tournamentsCompleted / REFERRAL_TOURNAMENTS_REQUIRED) * 100), 100),
            status: ref.status,
            reward: ref.status === "PAID" ? ref.amountPaid : REFERRAL_COMMISSION,
            qualifiedAt: ref.qualifiedAt,
            paidAt: ref.paidAt,
            createdAt: ref.createdAt,
        }));

        // Aggregate stats
        const totalReferrals = referrals.length;
        const pendingReferrals = referrals.filter((r) => r.status === "PENDING").length;
        const qualifiedReferrals = referrals.filter((r) => r.status === "QUALIFIED").length;
        const paidReferrals = referrals.filter((r) => r.status === "PAID").length;
        const totalUCPaid = referrals.filter((r) => r.status === "PAID").reduce((sum, r) => sum + r.amountPaid, 0);

        // Top promoters
        const promoterMap = new Map<string, { username: string; imageUrl: string | null; count: number; paid: number; earnings: number }>();
        for (const ref of referrals) {
            const existing = promoterMap.get(ref.promoterId);
            if (existing) {
                existing.count++;
                if (ref.status === "PAID") existing.paid++;
            } else {
                promoterMap.set(ref.promoterId, {
                    username: ref.promoter.username,
                    imageUrl: ref.promoter.imageUrl,
                    count: 1,
                    paid: ref.status === "PAID" ? 1 : 0,
                    earnings: ref.promoter.promoterEarnings,
                });
            }
        }
        const topPromoters = Array.from(promoterMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return SuccessResponse({
            data: {
                referrals: referralList,
                stats: {
                    total: totalReferrals,
                    pending: pendingReferrals,
                    qualified: qualifiedReferrals,
                    paid: paidReferrals,
                    totalUCPaid,
                    rewardPerReferral: REFERRAL_COMMISSION,
                    tournamentsRequired: REFERRAL_TOURNAMENTS_REQUIRED,
                },
                topPromoters,
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch referrals", error });
    }
}
