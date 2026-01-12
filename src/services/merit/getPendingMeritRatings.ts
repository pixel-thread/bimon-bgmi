import { prisma } from "@/src/lib/db/prisma";

/**
 * Get teammates from the most recent DECLARED tournament that haven't been rated yet.
 * A tournament is considered DECLARED when isWinnerDeclared = true.
 */
export async function getPendingMeritRatings(playerId: string) {
    // Find the most recent tournament where:
    // 1. This player participated (has MatchPlayerPlayed record)
    // 2. Winners have been declared (isWinnerDeclared = true)
    // 3. Player was NOT solo (team had more than 1 player)
    const recentMatch = await prisma.matchPlayerPlayed.findFirst({
        where: {
            playerId,
            tournament: {
                isWinnerDeclared: true,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            team: {
                include: {
                    players: {
                        include: {
                            user: {
                                select: {
                                    displayName: true,
                                    userName: true,
                                },
                            },
                        },
                    },
                },
            },
            tournament: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!recentMatch) {
        return { pendingRatings: [], tournament: null };
    }

    // Get teammates (exclude self)
    const teammates = recentMatch.team.players.filter((p) => p.id !== playerId);

    // If solo (no teammates), skip
    if (teammates.length === 0) {
        return { pendingRatings: [], tournament: null };
    }

    // Check which teammates have already been rated for this tournament
    const existingRatings = await prisma.playerMeritRating.findMany({
        where: {
            fromPlayerId: playerId,
            tournamentId: recentMatch.tournament.id,
            toPlayerId: {
                in: teammates.map((t) => t.id),
            },
        },
        select: {
            toPlayerId: true,
        },
    });

    const ratedPlayerIds = new Set(existingRatings.map((r) => r.toPlayerId));

    // Return unrated teammates
    const pendingRatings = teammates
        .filter((t) => !ratedPlayerIds.has(t.id))
        .map((t) => ({
            playerId: t.id,
            displayName: t.user.displayName || t.user.userName,
        }));

    return {
        pendingRatings,
        tournament: recentMatch.tournament,
    };
}
