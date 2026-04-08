import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

// Config keys for auto-action thresholds
const CONFIG_KEYS = {
    banThreshold: "merit_auto_ban_threshold",         // default 30
    restrictThreshold: "merit_auto_restrict_threshold", // default 50
    restrictMatches: "merit_auto_restrict_matches",     // default 3
    minRatings: "merit_min_ratings",                    // default 3
};

const DEFAULTS = {
    banThreshold: 30,
    restrictThreshold: 50,
    restrictMatches: 3,
    minRatings: 3,
};

/**
 * POST /api/polls/rate-merit
 * Submit a merit rating for a teammate from a specific tournament.
 *
 * Body: { toPlayerId: string, tournamentId: string, rating: number (1-5) }
 *
 * After recalculating the target player's merit score, auto-actions are checked:
 * - If score <= banThreshold and ratings >= minRatings → auto-ban
 * - If score <= restrictThreshold and ratings >= minRatings → auto-solo-restrict
 * - If score recovers above thresholds → lift restrictions
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthEmail();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { toPlayerId, tournamentId, rating } = body as {
            toPlayerId: string;
            tournamentId: string;
            rating: number;
        };

        if (!toPlayerId || !tournamentId || !rating) {
            return ErrorResponse({
                message: "toPlayerId, tournamentId, and rating are required",
                status: 400,
            });
        }

        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return ErrorResponse({
                message: "Rating must be an integer between 1 and 5",
                status: 400,
            });
        }

        // Get current player
        const user = await prisma.user.findFirst({
            where: userWhereEmail(userId),
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player profile not found", status: 404 });
        }

        const fromPlayerId = user.player.id;

        if (fromPlayerId === toPlayerId) {
            return ErrorResponse({ message: "Cannot rate yourself", status: 400 });
        }

        // Get the tournament's season
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { seasonId: true },
        });

        // Upsert the merit rating
        await prisma.playerMeritRating.upsert({
            where: {
                fromPlayerId_toPlayerId_tournamentId: {
                    fromPlayerId,
                    toPlayerId,
                    tournamentId,
                },
            },
            create: {
                fromPlayerId,
                toPlayerId,
                tournamentId,
                seasonId: tournament?.seasonId ?? null,
                rating,
            },
            update: {
                rating,
            },
        });

        // Recalculate the target player's merit score based on all ratings received
        const allRatingsReceived = await prisma.playerMeritRating.findMany({
            where: { toPlayerId },
            select: { rating: true },
        });

        let meritScore = 100; // default
        let autoAction: string | null = null;

        if (allRatingsReceived.length > 0) {
            const avg =
                allRatingsReceived.reduce((sum, r) => sum + r.rating, 0) /
                allRatingsReceived.length;
            meritScore = Math.round((avg / 5) * 100);

            // Fetch thresholds + enabled flag from AppConfig
            const configs = await prisma.appConfig.findMany({
                where: { key: { in: ["merit_rating_enabled", ...Object.values(CONFIG_KEYS)] } },
            });
            const configMap = new Map(configs.map((c) => [c.key, c.value]));
            const isEnabled = configMap.get("merit_rating_enabled") === "true";

            const banThreshold = parseInt(configMap.get(CONFIG_KEYS.banThreshold) ?? "") || DEFAULTS.banThreshold;
            const restrictThreshold = parseInt(configMap.get(CONFIG_KEYS.restrictThreshold) ?? "") || DEFAULTS.restrictThreshold;
            const restrictMatches = parseInt(configMap.get(CONFIG_KEYS.restrictMatches) ?? "") || DEFAULTS.restrictMatches;
            const minRatings = parseInt(configMap.get(CONFIG_KEYS.minRatings) ?? "") || DEFAULTS.minRatings;

            const hasEnoughRatings = allRatingsReceived.length >= minRatings;

            if (isEnabled && hasEnoughRatings && meritScore <= banThreshold) {
                // Auto-ban
                await prisma.player.update({
                    where: { id: toPlayerId },
                    data: {
                        meritScore,
                        isBanned: true,
                    },
                });
                autoAction = "banned";
            } else if (isEnabled && hasEnoughRatings && meritScore <= restrictThreshold) {
                // Auto-solo-restrict (only if not already banned)
                await prisma.player.update({
                    where: { id: toPlayerId },
                    data: {
                        meritScore,
                        isSoloRestricted: true,
                        soloMatchesNeeded: restrictMatches,
                    },
                });
                autoAction = "restricted";
            } else {
                // Score is healthy — just update score
                await prisma.player.update({
                    where: { id: toPlayerId },
                    data: { meritScore },
                });
            }
        }

        return SuccessResponse({
            data: { success: true, meritScore, autoAction },
            message: autoAction
                ? `Merit rating submitted — player auto-${autoAction}`
                : "Merit rating submitted",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to submit merit rating", error });
    }
}
