import { prisma } from "@/src/lib/db/prisma";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";

const SOLO_THRESHOLD = 40; // Below 40% = solo restricted (more lenient)
const SOLO_MATCHES_REQUIRED = 1; // Must play 1 solo match to restore
const MIN_RATINGS_FOR_RESTRICTION = 3; // Need at least 3 ratings before restrictions apply

/**
 * Calculate and update a player's merit score based on ratings received.
 * Uses average of all ratings from the CURRENT SEASON only (1-5 scale converted to 0-100).
 * 
 * Rules:
 * - New players start at 100%
 * - Need at least 3 ratings before restrictions can apply
 * - Below 40% = must play solo
 * - After 1 solo match, merit resets to 100%
 */
export async function calculateMerit(playerId: string) {
    // Get active season - only consider ratings from current season
    const activeSeason = await getActiveSeason();

    const ratings = await prisma.playerMeritRating.findMany({
        where: {
            toPlayerId: playerId,
            // Only count ratings from the active season
            ...(activeSeason?.id && { seasonId: activeSeason.id }),
        },
        select: {
            rating: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 20, // Consider last 20 ratings max
    });

    if (ratings.length === 0) {
        // No ratings this season, reset to default 100
        await prisma.player.update({
            where: { id: playerId },
            data: {
                meritScore: 100,
                isSoloRestricted: false,
                soloMatchesNeeded: 0,
            },
        });
        return { meritScore: 100, isSoloRestricted: false };
    }

    // Convert 1-5 rating scale to 0-100
    // 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
    const avgRating =
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const meritScore = Math.round(((avgRating - 1) / 4) * 100);

    // Only apply solo restriction if player has at least MIN_RATINGS_FOR_RESTRICTION ratings
    const isSoloRestricted = ratings.length >= MIN_RATINGS_FOR_RESTRICTION && meritScore < SOLO_THRESHOLD;

    // Update player
    await prisma.player.update({
        where: { id: playerId },
        data: {
            meritScore,
            isSoloRestricted,
            soloMatchesNeeded: isSoloRestricted ? SOLO_MATCHES_REQUIRED : 0,
        },
    });

    return { meritScore, isSoloRestricted };
}

/**
 * Reset a player's merit to 100% after completing their solo match.
 * Called when a restricted player completes a solo tournament.
 */
export async function resetMeritAfterSolo(playerId: string) {
    // Get active season to only delete ratings from current season
    const activeSeason = await getActiveSeason();

    // Delete ratings from current season only (give a fresh start for this season)
    if (activeSeason?.id) {
        await prisma.playerMeritRating.deleteMany({
            where: {
                toPlayerId: playerId,
                seasonId: activeSeason.id,
            },
        });
    }

    // Reset player to 100%
    await prisma.player.update({
        where: { id: playerId },
        data: {
            meritScore: 100,
            isSoloRestricted: false,
            soloMatchesNeeded: 0,
        },
    });

    return { meritScore: 100, isSoloRestricted: false };
}

/**
 * Submit a merit rating from one player to another.
 */
export async function submitMeritRating(
    fromPlayerId: string,
    toPlayerId: string,
    tournamentId: string,
    rating: number
) {
    if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    if (fromPlayerId === toPlayerId) {
        throw new Error("Cannot rate yourself");
    }

    // Get active season to tag the rating
    const activeSeason = await getActiveSeason();

    // Upsert the rating (in case they somehow submit twice)
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
            seasonId: activeSeason?.id, // Tag with current season
            rating,
        },
        update: {
            rating,
        },
    });

    // Recalculate the rated player's merit score
    await calculateMerit(toPlayerId);

    return { success: true };
}

/**
 * Get a player's current merit status.
 */
export async function getPlayerMerit(playerId: string) {
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
            meritScore: true,
            isSoloRestricted: true,
            soloMatchesNeeded: true,
        },
    });

    return player;
}

