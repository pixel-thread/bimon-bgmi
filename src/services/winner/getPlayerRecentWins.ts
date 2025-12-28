import { prisma } from "@/src/lib/db/prisma";
import { getTierInfo } from "@/src/utils/prizeDistribution";

/**
 * Get the count of "wins" (percentage-based prizes, not refunds) for players
 * in the last N tournaments of a season.
 * 
 * A "win" counts only for positions that receive percentage-based prizes:
 * - Tier 1: positions 1-2
 * - Tier 2: positions 1-2 (3rd is refund)
 * - Tier 3: positions 1-3 (4th is refund)
 * - Tier 4: positions 1-4 (5th is refund)
 */
export async function getPlayerRecentWins(
    playerIds: string[],
    seasonId: string,
    limit: number = 6
): Promise<Map<string, number>> {
    if (!seasonId || playerIds.length === 0) {
        return new Map();
    }

    // Get last N tournaments in the season that have declared winners
    const recentTournaments = await prisma.tournament.findMany({
        where: {
            seasonId,
            isWinnerDeclared: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            fee: true,
            tournamentWinner: {
                include: {
                    team: {
                        include: {
                            players: {
                                select: { id: true },
                            },
                        },
                    },
                },
            },
        },
    });

    // Count wins per player
    const winCounts = new Map<string, number>();

    // Initialize all player IDs with 0
    for (const playerId of playerIds) {
        winCounts.set(playerId, 0);
    }

    for (const tournament of recentTournaments) {
        // Calculate prize pool to determine tier
        // We use a rough estimate based on average team size (4 teams * 2 players = 8 participants)
        // This is used only to determine which positions count as "wins"
        const fee = tournament.fee || 50;
        const estimatedPool = fee * 16; // Rough estimate for tier determination
        const tier = getTierInfo(estimatedPool);

        // Positions that count as wins (all except the last position which is refund)
        // Tier 1: 2 winners, both count (no refund position)
        // Tier 2+: last position is refund, doesn't count
        const maxWinPosition = tier.level === 1 ? tier.winnerCount : tier.winnerCount - 1;

        for (const winner of tournament.tournamentWinner) {
            // Only count if position is a "win" (not a refund position)
            if (winner.position <= maxWinPosition) {
                for (const player of winner.team.players) {
                    if (playerIds.includes(player.id)) {
                        const currentCount = winCounts.get(player.id) || 0;
                        winCounts.set(player.id, currentCount + 1);
                    }
                }
            }
        }
    }

    return winCounts;
}
