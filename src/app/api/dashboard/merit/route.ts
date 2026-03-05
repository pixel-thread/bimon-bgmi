import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

const MERIT_ENABLED_KEY = "merit_rating_enabled";
const PAGE_SIZE = 20;

// Threshold config keys (shared with rate-merit route)
const THRESHOLD_KEYS = {
    banThreshold: "merit_auto_ban_threshold",
    restrictThreshold: "merit_auto_restrict_threshold",
    restrictMatches: "merit_auto_restrict_matches",
    minRatings: "merit_min_ratings",
};

const THRESHOLD_DEFAULTS = {
    banThreshold: 30,
    restrictThreshold: 50,
    restrictMatches: 3,
    minRatings: 3,
};

/**
 * GET /api/dashboard/merit
 * Returns merit system status, stats, paginated player list (sorted by lowest merit),
 * recent ratings, and auto-action thresholds.
 *
 * Query params:
 *  - page: page number (default 1)
 */
export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const skip = (page - 1) * PAGE_SIZE;

        // Get all config in one query
        const allConfigs = await prisma.appConfig.findMany({
            where: {
                key: { in: [MERIT_ENABLED_KEY, ...Object.values(THRESHOLD_KEYS)] },
            },
        });
        const configMap = new Map(allConfigs.map((c) => [c.key, c.value]));

        const isEnabled = configMap.get(MERIT_ENABLED_KEY) === "true";
        const thresholds = {
            banThreshold: parseInt(configMap.get(THRESHOLD_KEYS.banThreshold) ?? "") || THRESHOLD_DEFAULTS.banThreshold,
            restrictThreshold: parseInt(configMap.get(THRESHOLD_KEYS.restrictThreshold) ?? "") || THRESHOLD_DEFAULTS.restrictThreshold,
            restrictMatches: parseInt(configMap.get(THRESHOLD_KEYS.restrictMatches) ?? "") || THRESHOLD_DEFAULTS.restrictMatches,
            minRatings: parseInt(configMap.get(THRESHOLD_KEYS.minRatings) ?? "") || THRESHOLD_DEFAULTS.minRatings,
        };

        // Get all players sorted by lowest merit first (paginated)
        const [allPlayers, totalPlayers] = await Promise.all([
            prisma.player.findMany({
                orderBy: { meritScore: "asc" },
                skip,
                take: PAGE_SIZE,
                select: {
                    id: true,
                    displayName: true,
                    meritScore: true,
                    isSoloRestricted: true,
                    soloMatchesNeeded: true,
                    isBanned: true,
                    user: { select: { username: true } },
                    _count: {
                        select: {
                            meritRatingsReceived: true,
                        },
                    },
                },
            }),
            prisma.player.count(),
        ]);

        // Recent ratings (only on first page)
        let ratings: any[] = [];
        if (page === 1) {
            ratings = await prisma.playerMeritRating.findMany({
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    rating: true,
                    createdAt: true,
                    fromPlayer: {
                        select: {
                            id: true,
                            displayName: true,
                            user: { select: { username: true } },
                        },
                    },
                    toPlayer: {
                        select: {
                            id: true,
                            displayName: true,
                            meritScore: true,
                            user: { select: { username: true } },
                        },
                    },
                    tournamentId: true,
                },
            });
        }

        // Stats (only on first page)
        let stats = { totalRatings: 0, avgRating: 0 };
        if (page === 1) {
            const [totalRatings, avgRating] = await Promise.all([
                prisma.playerMeritRating.count(),
                prisma.playerMeritRating.aggregate({ _avg: { rating: true } }),
            ]);
            stats = {
                totalRatings,
                avgRating: avgRating._avg.rating ?? 0,
            };
        }

        return SuccessResponse({
            data: {
                isEnabled,
                thresholds,
                players: allPlayers,
                totalPlayers,
                page,
                totalPages: Math.ceil(totalPlayers / PAGE_SIZE),
                ratings,
                stats,
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch merit data", error });
    }
}

/**
 * PATCH /api/dashboard/merit
 * Toggle merit system on/off, or update auto-action thresholds. Super admin only.
 *
 * Body: { enabled?: boolean, thresholds?: { banThreshold, restrictThreshold, restrictMatches, minRatings } }
 */
export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { enabled, thresholds } = body as {
            enabled?: boolean;
            thresholds?: {
                banThreshold?: number;
                restrictThreshold?: number;
                restrictMatches?: number;
                minRatings?: number;
            };
        };

        const ops: Promise<unknown>[] = [];

        // Toggle merit system
        if (typeof enabled === "boolean") {
            ops.push(
                prisma.appConfig.upsert({
                    where: { key: MERIT_ENABLED_KEY },
                    create: { key: MERIT_ENABLED_KEY, value: String(enabled) },
                    update: { value: String(enabled) },
                })
            );
        }

        // Update thresholds
        if (thresholds) {
            const updates: [string, number][] = [];
            if (thresholds.banThreshold !== undefined) updates.push([THRESHOLD_KEYS.banThreshold, thresholds.banThreshold]);
            if (thresholds.restrictThreshold !== undefined) updates.push([THRESHOLD_KEYS.restrictThreshold, thresholds.restrictThreshold]);
            if (thresholds.restrictMatches !== undefined) updates.push([THRESHOLD_KEYS.restrictMatches, thresholds.restrictMatches]);
            if (thresholds.minRatings !== undefined) updates.push([THRESHOLD_KEYS.minRatings, thresholds.minRatings]);

            for (const [key, value] of updates) {
                ops.push(
                    prisma.appConfig.upsert({
                        where: { key },
                        create: { key, value: String(value) },
                        update: { value: String(value) },
                    })
                );
            }
        }

        await Promise.all(ops);

        return SuccessResponse({
            data: { updated: true },
            message: "Merit settings updated",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update merit setting", error });
    }
}
