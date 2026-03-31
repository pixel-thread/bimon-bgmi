import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { GAME } from "@/lib/game-config";

async function checkAdmin() {
    const userId = await getAuthEmail();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
        where: { email: userId },
        select: { role: true },
    });
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null;
    return user;
}

/**
 * GET /api/dashboard/royal-pass
 * Admin: Fetch all ${GAME.passName} holders with player details.
 */
export async function GET(request: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { searchParams } = new URL(request.url);
        let seasonId = searchParams.get("seasonId");

        // Default to current active season if no seasonId specified
        if (!seasonId) {
            const activeSeason = await prisma.season.findFirst({
                where: { status: "ACTIVE" },
                select: { id: true },
            });
            if (activeSeason) seasonId = activeSeason.id;
        }

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

        // UC Rewarded — count from actual Transaction records (CREDIT with "streak" in desc)
        // Filter to current season only (by season start date)
        const allRpPlayerIds = [...new Set(royalPasses.map((rp) => rp.playerId))];
        const seasonStartDate = currentSeason
            ? (await prisma.season.findUnique({ where: { id: currentSeason.id }, select: { startDate: true } }))?.startDate
            : undefined;

        const streakTransactions = allRpPlayerIds.length > 0
            ? await prisma.transaction.findMany({
                where: {
                    playerId: { in: allRpPlayerIds },
                    type: "CREDIT",
                    description: { contains: "Streak", mode: "insensitive" },
                    ...(seasonStartDate ? { createdAt: { gte: seasonStartDate } } : {}),
                },
                select: { playerId: true, amount: true },
            })
            : [];

        // Per-player UC earned from streak rewards
        const ucEarnedMap = new Map<string, number>();
        for (const tx of streakTransactions) {
            ucEarnedMap.set(tx.playerId, (ucEarnedMap.get(tx.playerId) || 0) + tx.amount);
        }

        // UC Rewarded = only for current season RP holders
        const currentSeasonPlayerIds = new Set(currentSeasonPasses.map((rp) => rp.playerId));
        const ucRewarded = streakTransactions
            .filter((tx) => currentSeasonPlayerIds.has(tx.playerId))
            .reduce((sum, tx) => sum + tx.amount, 0);

        // Non-RP holder streaks
        const nonRpStreaks = await prisma.playerStreak.findMany({
            where: {
                current: { gt: 0 },
                player: { hasRoyalPass: false },
            },
            select: {
                current: true,
                longest: true,
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        userId: true,
                    },
                },
            },
            orderBy: { current: "desc" },
        });

        const nonRpUserIds = [...new Set(nonRpStreaks.map((s) => s.player.userId))];
        const nonRpUsers = nonRpUserIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: nonRpUserIds } },
                select: { id: true, username: true, imageUrl: true },
            })
            : [];
        const nonRpUserMap = new Map(nonRpUsers.map((u) => [u.id, u]));

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
                    ucEarned: ucEarnedMap.get(rp.playerId) || 0,
                    seasonName: rp.season?.name ?? "None",
                    createdAt: rp.createdAt,
                };
            }),
            nonRpStreaks: nonRpStreaks.map((s) => {
                const user = nonRpUserMap.get(s.player.userId);
                return {
                    playerId: s.player.id,
                    displayName: s.player.displayName ?? "Unknown",
                    username: user?.username ?? "unknown",
                    imageUrl: user?.imageUrl ?? "",
                    streak: s.current,
                    longest: s.longest,
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
        console.error(`[${GAME.passName} API Error]`, error);
        return ErrorResponse({ message: `Failed to fetch ${GAME.passName} data`, error });
    }
}

/**
 * POST /api/dashboard/royal-pass
 * Admin: Grant ${GAME.passName} to a player.
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

        // Check for existing RP in this season
        if (currentSeason) {
            const existing = await prisma.royalPass.findUnique({
                where: { playerId_seasonId: { playerId, seasonId: currentSeason.id } },
            });
            if (existing) {
                return ErrorResponse({ message: `Player already has ${GAME.passName} this season`, status: 400 });
            }
        }

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
        return ErrorResponse({ message: `Failed to grant ${GAME.passName}`, error });
    }
}

/**
 * PATCH /api/dashboard/royal-pass
 * Admin: Toggle ${GAME.passName} status for a player.
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
        return ErrorResponse({ message: `Failed to update ${GAME.passName} status`, error });
    }
}
