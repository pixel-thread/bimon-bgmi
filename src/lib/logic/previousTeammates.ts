import { prisma } from "@/lib/database";

/**
 * Get a map of previous teammates for each player from the most recent N tournaments.
 * This is used to prevent players from being on the same team back-to-back.
 * 
 * @param seasonId - The current season ID
 * @param currentTournamentId - The current tournament ID (to exclude)
 * @param playerIds - List of player IDs to check
 * @param lookbackCount - Number of previous tournaments to look back (default: 1 for back-to-back prevention)
 * @returns Map<playerId, Set<previousTeammatePlayerIds>>
 */
export async function getPreviousTournamentTeammates(
    seasonId: string,
    currentTournamentId: string,
    playerIds: string[],
    lookbackCount: number = 1
): Promise<Map<string, Set<string>>> {
    const teammatesMap = new Map<string, Set<string>>();

    if (playerIds.length === 0) return teammatesMap;

    // Initialize empty sets for all players
    for (const playerId of playerIds) {
        teammatesMap.set(playerId, new Set<string>());
    }

    // Get the most recent N tournaments in this season (excluding the current one)
    const recentTournaments = await prisma.tournament.findMany({
        where: {
            seasonId,
            id: { not: currentTournamentId },
            status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        take: lookbackCount,
        select: { id: true },
    });

    if (recentTournaments.length === 0) {
        return teammatesMap;
    }

    const tournamentIds = recentTournaments.map(t => t.id);

    // Get all teams from these tournaments that include any of our players
    const teams = await prisma.team.findMany({
        where: {
            tournamentId: { in: tournamentIds },
            players: {
                some: {
                    id: { in: playerIds },
                },
            },
        },
        include: {
            players: {
                select: { id: true },
            },
        },
    });

    // Build the teammates map
    for (const team of teams) {
        const teamPlayerIds = team.players.map(p => p.id);

        // For each player on this team, add all other teammates
        for (const playerId of teamPlayerIds) {
            if (!playerIds.includes(playerId)) continue;

            const playerTeammates = teammatesMap.get(playerId) ?? new Set<string>();

            for (const teammateId of teamPlayerIds) {
                if (teammateId !== playerId) {
                    playerTeammates.add(teammateId);
                }
            }

            teammatesMap.set(playerId, playerTeammates);
        }
    }

    return teammatesMap;
}

/**
 * Check if two players were teammates in any of the previous N tournaments.
 */
export function wereTeammates(
    player1Id: string,
    player2Id: string,
    teammatesMap: Map<string, Set<string>>
): boolean {
    const player1Teammates = teammatesMap.get(player1Id);
    return player1Teammates?.has(player2Id) ?? false;
}

/**
 * Check if any pair of players in the proposed team were previous teammates.
 */
export function hasAnyPreviousTeammates(
    playerIds: string[],
    teammatesMap: Map<string, Set<string>>
): boolean {
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            if (wereTeammates(playerIds[i], playerIds[j], teammatesMap)) {
                return true;
            }
        }
    }
    return false;
}
