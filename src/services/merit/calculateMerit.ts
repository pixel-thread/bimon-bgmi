import { prisma } from "@/src/lib/db/prisma";

const SOLO_THRESHOLD = 50; // Below 50% = solo restricted
const SOLO_MATCHES_REQUIRED = 2; // Must play 2 solo matches to restore

/**
 * Calculate and update a player's merit score based on ratings received.
 * Uses average of all ratings (1-5 scale converted to 0-100).
 */
export async function calculateMerit(playerId: string) {
    const ratings = await prisma.playerMeritRating.findMany({
        where: {
            toPlayerId: playerId,
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
        // No ratings yet, keep default 100
        return { meritScore: 100, isSoloRestricted: false };
    }

    // Convert 1-5 rating scale to 0-100
    // 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
    const avgRating =
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const meritScore = Math.round(((avgRating - 1) / 4) * 100);

    const isSoloRestricted = meritScore < SOLO_THRESHOLD;

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
