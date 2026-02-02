import { prisma } from "@/src/lib/db/prisma";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";

/**
 * Get teammates from the most recent DECLARED tournament that haven't been rated yet.
 * A tournament is considered DECLARED when isWinnerDeclared = true.
 * Only considers tournaments from the CURRENT ACTIVE season.
 */
export async function getPendingMeritRatings(playerId: string) {
    // Get active season - only show ratings for current season tournaments
    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
        return { pendingRatings: [], tournament: null };
    }

    // Find the most recent declared tournament where this player participated
    const recentMatch = await prisma.matchPlayerPlayed.findFirst({
        where: {
            playerId,
            seasonId: activeSeason.id,
            tournament: { isWinnerDeclared: true },
        },
        orderBy: { createdAt: "desc" },
        select: {
            teamId: true,
            tournamentId: true,
            tournament: {
                select: { id: true, name: true },
            },
        },
    });

    if (!recentMatch) {
        return { pendingRatings: [], tournament: null };
    }

    // Get teammates from the same team in this tournament (excluding self)
    const teammates = await prisma.matchPlayerPlayed.findMany({
        where: {
            teamId: recentMatch.teamId,
            tournamentId: recentMatch.tournamentId,
            playerId: { not: playerId },
        },
        distinct: ['playerId'],
        select: {
            playerId: true,
            player: {
                select: {
                    id: true,
                    user: {
                        select: { displayName: true, userName: true },
                    },
                },
            },
        },
    });

    // Solo players have no teammates to rate
    if (teammates.length === 0) {
        return { pendingRatings: [], tournament: null };
    }

    // Check which teammates have already been rated for this tournament
    const existingRatings = await prisma.playerMeritRating.findMany({
        where: {
            fromPlayerId: playerId,
            tournamentId: recentMatch.tournament.id,
            toPlayerId: { in: teammates.map((t) => t.playerId) },
        },
        select: { toPlayerId: true },
    });

    const ratedPlayerIds = new Set(existingRatings.map((r) => r.toPlayerId));

    // Return unrated teammates
    const pendingRatings = teammates
        .filter((t) => !ratedPlayerIds.has(t.playerId))
        .map((t) => ({
            playerId: t.player.id,
            displayName: t.player.user.displayName || t.player.user.userName,
        }));

    return {
        pendingRatings,
        tournament: recentMatch.tournament,
    };
}
