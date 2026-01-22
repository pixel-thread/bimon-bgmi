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

    // Find the most recent tournament where:
    // 1. This player participated (has MatchPlayerPlayed record)
    // 2. Winners have been declared (isWinnerDeclared = true)
    // 3. Player was NOT solo (team had more than 1 player)
    // 4. Tournament is from the current active season
    const recentMatch = await prisma.matchPlayerPlayed.findFirst({
        where: {
            playerId,
            seasonId: activeSeason.id, // Only current season
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

    // Get actual teammates from the same team AND tournament using MatchPlayerPlayed records
    // This is more accurate than team.players which can include players from other tournaments
    const teammatesInTournament = await prisma.matchPlayerPlayed.findMany({
        where: {
            teamId: recentMatch.teamId,
            tournamentId: recentMatch.tournamentId,
            playerId: { not: playerId }, // Exclude self
        },
        distinct: ['playerId'], // Get unique players (in case of multiple matches)
        include: {
            player: {
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
    });

    // If solo (no teammates in this tournament), skip
    if (teammatesInTournament.length === 0) {
        return { pendingRatings: [], tournament: null };
    }

    const teammates = teammatesInTournament.map((mpp) => mpp.player);

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

