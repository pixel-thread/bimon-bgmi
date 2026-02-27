import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

const REFERRAL_COMMISSION = 20;
const REFERRAL_TOURNAMENTS_REQUIRED = 5;

/**
 * GET /api/referrals
 * Returns the current user's referral stats and list of referred players.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        // Get all referrals where current user is the promoter
        const referrals = await prisma.referral.findMany({
            where: { promoterId: user.id },
            include: {
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
            playerName: ref.referredPlayer.displayName || ref.referredPlayer.user?.username || "Unknown",
            imageUrl: ref.referredPlayer.user?.imageUrl || null,
            tournamentsCompleted: ref.tournamentsCompleted,
            tournamentsRequired: REFERRAL_TOURNAMENTS_REQUIRED,
            progress: Math.min(Math.round((ref.tournamentsCompleted / REFERRAL_TOURNAMENTS_REQUIRED) * 100), 100),
            status: ref.status,
            reward: REFERRAL_COMMISSION,
            isPaid: ref.status === "PAID",
            paidAt: ref.paidAt,
            createdAt: ref.createdAt,
        }));

        const totalReferrals = referrals.length;
        const activeReferrals = referrals.filter((r) => r.status === "PENDING").length;
        const paidReferrals = referrals.filter((r) => r.status === "PAID").length;
        const totalEarned = paidReferrals * REFERRAL_COMMISSION;

        return SuccessResponse({
            data: {
                referrals: referralList,
                stats: {
                    total: totalReferrals,
                    active: activeReferrals,
                    paid: paidReferrals,
                    totalEarned,
                    rewardPerReferral: REFERRAL_COMMISSION,
                    tournamentsRequired: REFERRAL_TOURNAMENTS_REQUIRED,
                },
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch referrals", error });
    }
}
