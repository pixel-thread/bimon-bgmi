import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

const MERIT_ENABLED_KEY = "merit_rating_enabled";
const PAGE_SIZE = 20;

/**
 * GET /api/dashboard/merit
 * Returns merit system status, stats, paginated player list (sorted by lowest merit),
 * and recent ratings.
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

        // Get config
        const config = await prisma.appConfig.findUnique({
            where: { key: MERIT_ENABLED_KEY },
        });
        const isEnabled = config?.value === "true";

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
 * Toggle merit system on/off. Super admin only.
 */
export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { enabled } = body as { enabled: boolean };

        await prisma.appConfig.upsert({
            where: { key: MERIT_ENABLED_KEY },
            create: { key: MERIT_ENABLED_KEY, value: String(enabled) },
            update: { value: String(enabled) },
        });

        return SuccessResponse({
            data: { isEnabled: enabled },
            message: `Merit system ${enabled ? "enabled" : "disabled"}`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update merit setting", error });
    }
}
