import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

async function checkAdmin() {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
    });
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null;
    return user;
}

/**
 * GET /api/dashboard/royal-pass
 * Admin: Fetch all Royal Pass holders with player details.
 */
export async function GET(request: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get("seasonId");

        const royalPasses = await prisma.royalPass.findMany({
            where: seasonId ? { seasonId } : {},
            select: {
                id: true,
                playerId: true,
                amount: true,
                displayValue: true,
                pricePaid: true,
                promoCode: true,
                seasonId: true,
                createdAt: true,
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        hasRoyalPass: true,
                        userId: true,
                        streak: { select: { current: true } },
                    },
                },
                season: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Fetch user details separately for display names and avatars
        const playerIds = [...new Set(royalPasses.map((rp) => rp.player.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, username: true, imageUrl: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        // Current season stats
        const currentSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true, name: true },
        });

        const currentSeasonPasses = currentSeason
            ? royalPasses.filter((rp) => rp.seasonId === currentSeason.id)
            : royalPasses;

        const ucCollected = currentSeasonPasses.reduce((sum, rp) => sum + rp.amount, 0);
        const paidPurchases = currentSeasonPasses.filter((rp) => rp.pricePaid > 0).length;

        // UC Rewarded & per-player UC earned from PlayerStreak
        const allRpPlayerIds = [...new Set(royalPasses.map((rp) => rp.playerId))];
        const streakRewards = allRpPlayerIds.length > 0
            ? await prisma.playerStreak.findMany({
                where: { playerId: { in: allRpPlayerIds } },
                select: { playerId: true, pendingReward: true, lastRewardAt: true },
            })
            : [];
        const rewardMap = new Map(streakRewards.map((s) => [s.playerId, s]));

        // UC Rewarded = only claimed rewards (lastRewardAt set, no pending)
        const rpStreaks = streakRewards.filter((s) =>
            currentSeasonPasses.some((rp) => rp.playerId === s.playerId)
        );
        const ucRewarded = rpStreaks.filter((s) => s.lastRewardAt && !s.pendingReward).length * 30;

        const data = {
            passes: royalPasses.map((rp) => {
                const user = userMap.get(rp.player.userId);
                return {
                    id: rp.id,
                    playerId: rp.playerId,
                    displayName: rp.player.displayName ?? "Unknown",
                    username: user?.username ?? "unknown",
                    imageUrl: user?.imageUrl ?? "",
                    hasRoyalPass: rp.player.hasRoyalPass,
                    amount: rp.amount,
                    displayValue: rp.displayValue,
                    pricePaid: rp.pricePaid,
                    promoCode: rp.promoCode,
                    streak: rp.player.streak?.current ?? 0,
                    ucEarned: (() => {
                        const s = rewardMap.get(rp.playerId);
                        if (!s) return 0;
                        // Only count as earned when claimed (lastRewardAt set, pendingReward null)
                        if (s.lastRewardAt && !s.pendingReward) return 30;
                        return 0;
                    })(),
                    seasonName: rp.season?.name ?? "None",
                    createdAt: rp.createdAt,
                };
            }),
            stats: {
                totalPasses: currentSeasonPasses.length,
                ucCollected,
                ucRewarded,
                paidPurchases,
            },
        };

        return SuccessResponse({ data });
    } catch (error) {
        console.error("[Royal Pass API Error]", error);
        return ErrorResponse({ message: "Failed to fetch Royal Pass data", error });
    }
}

/**
 * POST /api/dashboard/royal-pass
 * Admin: Grant Royal Pass to a player.
 */
export async function POST(request: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { playerId, amount, displayValue, pricePaid, promoCode } = body;

        if (!playerId || amount === undefined || displayValue === undefined || pricePaid === undefined) {
            return ErrorResponse({ message: "playerId, amount, displayValue, pricePaid are required", status: 400 });
        }

        const currentSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true },
        });

        const [royalPass] = await prisma.$transaction([
            prisma.royalPass.create({
                data: {
                    playerId,
                    seasonId: currentSeason?.id,
                    amount,
                    displayValue,
                    pricePaid,
                    promoCode: promoCode || null,
                },
            }),
            prisma.player.update({
                where: { id: playerId },
                data: { hasRoyalPass: true },
            }),
        ]);

        return SuccessResponse({ data: royalPass });
    } catch (error) {
        return ErrorResponse({ message: "Failed to grant Royal Pass", error });
    }
}

/**
 * PATCH /api/dashboard/royal-pass
 * Admin: Toggle Royal Pass status for a player.
 */
export async function PATCH(request: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { playerId, hasRoyalPass } = body;

        if (!playerId || hasRoyalPass === undefined) {
            return ErrorResponse({ message: "playerId and hasRoyalPass are required", status: 400 });
        }

        const updated = await prisma.player.update({
            where: { id: playerId },
            data: { hasRoyalPass },
            select: { id: true, displayName: true, hasRoyalPass: true },
        });

        return SuccessResponse({ data: updated });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update Royal Pass status", error });
    }
}
