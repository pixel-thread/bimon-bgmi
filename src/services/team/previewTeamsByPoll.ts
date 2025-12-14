import { prisma } from "@/src/lib/db/prisma";
import { shuffle } from "@/src/utils/shuffle";
import {
    assignPlayersToTeamsBalanced,
    createBalancedDuos,
    analyzeTeamBalance,
    TeamStats,
} from "@/src/utils/teamBalancer";
import { computeWeightedScore, PlayerWithWins } from "@/src/utils/scoreUtil";
import { PlayerWithWeightT } from "@/src/types/player";

type Props = {
    groupSize: 1 | 2 | 3 | 4;
    tournamentId: string;
    seasonId: string;
    pollId: string;
    entryFee?: number;
};

export type TeamPreviewPlayer = {
    id: string;
    userName: string;
    balance: number;
    kills: number;
    deaths: number;
    kd: number;
    category?: string;
    recentWins?: number;
};

export type TeamPreview = {
    teamNumber: number;
    teamName: string;
    players: TeamPreviewPlayer[];
    totalKills: number;
    totalDeaths: number;
    weightedScore: number;
};

export type PreviewTeamsByPollsResult = {
    teams: TeamPreview[];
    playersWithInsufficientBalance: { id: string; userName: string; balance: number }[];
    entryFee: number;
    tournamentName: string;
    totalPlayersEligible: number;
};

/**
 * Query recent wins (1st & 2nd place) in last N tournaments for given players.
 * Returns map of playerId -> win points (1st=2pts, 2nd=1pt)
 */
async function getPlayerRecentWins(
    playerIds: string[],
    seasonId: string,
    limit: number = 6
): Promise<Map<string, number>> {
    const recentWins = new Map<string, number>();

    if (playerIds.length === 0) return recentWins;

    // Get recent tournaments in the season
    const recentTournaments = await prisma.tournament.findMany({
        where: { seasonId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true },
    });

    const tournamentIds = recentTournaments.map(t => t.id);
    if (tournamentIds.length === 0) return recentWins;

    // Get winners for these tournaments (position 1 or 2)
    const winners = await prisma.tournamentWinner.findMany({
        where: {
            tournamentId: { in: tournamentIds },
            position: { in: [1, 2] },
        },
        include: {
            team: {
                include: {
                    players: { select: { id: true } },
                },
            },
        },
    });

    // Count wins per player (1st = 2 points, 2nd = 1 point)
    for (const winner of winners) {
        const points = winner.position === 1 ? 2 : 1;
        for (const player of winner.team.players) {
            if (playerIds.includes(player.id)) {
                const current = recentWins.get(player.id) ?? 0;
                recentWins.set(player.id, current + points);
            }
        }
    }

    return recentWins;
}

export async function previewTeamsByPolls({
    groupSize,
    pollId,
    tournamentId,
    seasonId,
    entryFee = 0,
}: Props): Promise<PreviewTeamsByPollsResult> {
    if (![1, 2, 3, 4].includes(groupSize)) {
        throw new Error("Invalid group size");
    }

    // Get tournament name
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { name: true },
    });

    let players = await prisma.player.findMany({
        where: {
            isBanned: false,
            playerPollVote: {
                some: {
                    pollId,
                    vote: { not: "OUT" },
                },
            },
        },
        include: {
            playerStats: true,
            playerPollVote: true,
            user: true,
            uc: true,
        },
    });

    // Create a map of player ID to UC balance for later lookup
    const playerBalanceMap = new Map<string, number>();
    players.forEach((p) => {
        playerBalanceMap.set(p.id, p.uc?.balance ?? 0);
    });


    // Track players with insufficient balance (for info only - no longer excluded)
    const playersWithInsufficientBalance: { id: string; userName: string; balance: number }[] = [];

    if (entryFee > 0) {
        // Just track players with low balance for display purposes
        players.forEach((p) => {
            const balance = p.uc?.balance ?? 0;
            if (balance < entryFee) {
                playersWithInsufficientBalance.push({
                    id: p.id,
                    userName: p.user.userName,
                    balance,
                });
            }
        });
        // Note: Players are no longer excluded - they can still participate
    }

    // Fetch eligible players who voted in the poll and are not banned
    if (players.length === 0) {
        throw new Error("No eligible players found for this poll.");
    }

    // Get recent wins for all players (last 6 tournaments)
    const recentWinsMap = await getPlayerRecentWins(
        players.map(p => p.id),
        seasonId,
        6
    );

    // Filter players who voted SOLO in THIS poll - they will be solo
    // Important: Only check the vote for the current pollId, not all historical votes
    const playersWhoVotedSolo = players.filter((p) =>
        p.playerPollVote.some((vote) => vote.pollId === pollId && vote.vote === "SOLO"),
    );

    // Compute weighted scores with recent wins
    const playersWithScore: (PlayerWithWeightT & { recentWins: number })[] = players.map((p) => {
        const recentWins = recentWinsMap.get(p.id) ?? 0;
        const playerWithWins: PlayerWithWins = { ...p, recentWins };
        return {
            ...p,
            recentWins,
            weightedScore: computeWeightedScore(playerWithWins, seasonId),
        };
    });

    // Separate solo voters from team players
    const soloPlayers: typeof playersWithScore = [];
    let playersForTeams: typeof playersWithScore = [];

    // All SOLO voters go to solo teams
    for (const p of playersWithScore) {
        if (playersWhoVotedSolo.some((solo) => solo.id === p.id)) {
            soloPlayers.push(p);
        } else {
            playersForTeams.push(p);
        }
    }

    // Sort remaining players by weighted score descending
    playersForTeams.sort((a, b) => b.weightedScore - a.weightedScore);

    // Check for odd number of players (when groupSize > 1)
    // If odd, the highest-scoring player becomes a solo leftover
    if (groupSize > 1 && playersForTeams.length % groupSize !== 0) {
        const leftoverCount = playersForTeams.length % groupSize;
        // Take the highest-scoring leftover players and make them solo
        for (let i = 0; i < leftoverCount; i++) {
            const leftover = playersForTeams.shift(); // Take from front (highest scores)
            if (leftover) {
                soloPlayers.push(leftover);
            }
        }
    }

    // Shuffle players to allow regeneration to produce different team compositions
    // The balanced algorithms will still distribute fairly, but with different pairings
    playersForTeams = shuffle(playersForTeams);

    const teamCount = Math.floor(playersForTeams.length / groupSize);
    if (teamCount === 0 && soloPlayers.length === 0) {
        throw new Error("Not enough players to form teams.");
    }

    // Use duo pair optimization for groupSize 2, snake draft otherwise
    let teams: TeamStats[] = [];
    if (teamCount > 0) {
        if (groupSize === 2) {
            // Duo mode: pair strongest with weakest for balanced teams
            teams = createBalancedDuos(playersForTeams as unknown as PlayerWithWeightT[], seasonId);
        } else {
            // Squad/Solo mode: use snake draft
            teams = assignPlayersToTeamsBalanced(
                playersForTeams as unknown as PlayerWithWeightT[],
                teamCount,
                groupSize,
            );
        }
    }

    // Add all solo players as individual teams
    for (const soloPlayer of soloPlayers) {
        const soloStats = soloPlayer.playerStats.find(
            (p) => p.seasonId === seasonId,
        );
        teams.push({
            players: [soloPlayer as unknown as PlayerWithWeightT],
            totalKills: soloStats?.kills ?? 0,
            totalDeaths: soloStats?.deaths ?? 0,
            totalWins: 0,
            weightedScore: soloPlayer.weightedScore,
        });
    }

    // Analyze team balance
    analyzeTeamBalance(teams);

    // Shuffle final teams order
    teams = shuffle(teams);

    // Convert to preview format
    const teamPreviews: TeamPreview[] = teams.map((t, index) => {
        const teamPlayers: TeamPreviewPlayer[] = t.players.map((p) => {
            const stats = p.playerStats.find((s) => s.seasonId === seasonId);
            const kills = stats?.kills ?? 0;
            const deaths = stats?.deaths ?? 1;
            const kd = deaths > 0 ? kills / deaths : kills;
            // @ts-expect-error recentWins added at runtime
            const recentWins = p.recentWins ?? 0;

            return {
                id: p.id,
                userName: p.user.userName,
                balance: playerBalanceMap.get(p.id) ?? 0,
                kills,
                deaths,
                kd: Math.round(kd * 100) / 100,
                recentWins,
            };
        });

        return {
            teamNumber: index + 1,
            teamName: `Team ${index + 1}`,
            players: teamPlayers,
            totalKills: t.totalKills,
            totalDeaths: t.totalDeaths,
            weightedScore: t.weightedScore,
        };
    });

    return {
        teams: teamPreviews,
        playersWithInsufficientBalance,
        entryFee,
        tournamentName: tournament?.name ?? "Unknown Tournament",
        totalPlayersEligible: players.length,
    };
}

