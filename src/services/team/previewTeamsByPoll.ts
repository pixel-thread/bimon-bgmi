import { prisma } from "@/src/lib/db/prisma";
import { shuffle } from "@/src/utils/shuffle";
import {
    createBalancedDuos,
    createBalancedTrios,
    createBalancedQuads,
    analyzeTeamBalance,
    TeamStats,
} from "@/src/utils/teamBalancer";
import { computeWeightedScore, PlayerWithWins, SeasonScoringConfig } from "@/src/utils/scoreUtil";
import { PlayerWithWeightT } from "@/src/types/player";
import { getPreviousTournamentTeammates } from "@/src/utils/previousTeammates";
import { getAppSetting, setAppSetting } from "@/src/services/settings/getAppSetting";

/**
 * Select a lucky voter from eligible players with anti-abuse protection.
 * Priority system:
 * 1. Exclude players already lucky this season
 * 2. Exclude recent winners (got UC prizes in last 3 tournaments)
 * 3. Favor players with most losses (entry fees - prizes > 0)
 * - Uses deterministic random based on pollId for reproducibility
 */
export async function selectLuckyVoter(
    eligiblePlayerIds: string[],
    pollId: string,
    seasonId: string
): Promise<string | null> {
    if (eligiblePlayerIds.length === 0) return null;

    // Get lucky voters for this season from AppSetting
    const luckyVotersJson = await getAppSetting("luckyVotersBySeason");
    const luckyVotersBySeason: Record<string, string[]> = luckyVotersJson
        ? JSON.parse(luckyVotersJson)
        : {};

    // Get players who have already been lucky this season
    const seasonLuckyVoters = luckyVotersBySeason[seasonId] || [];

    // Step 1: Filter out players already lucky this season
    let candidates = eligiblePlayerIds.filter(
        id => !seasonLuckyVoters.includes(id)
    );

    // If all are lucky, reset to all eligible
    if (candidates.length === 0) {
        candidates = eligiblePlayerIds;
    }

    // Step 2: Get recent winners (last 6 tournaments) and exclude them
    const recentTournaments = await prisma.tournament.findMany({
        where: { seasonId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true },
    });

    if (recentTournaments.length > 0) {
        const recentWinners = await prisma.tournamentWinner.findMany({
            where: {
                tournamentId: { in: recentTournaments.map(t => t.id) },
            },
            include: {
                team: { include: { players: { select: { id: true } } } },
            },
        });

        const recentWinnerIds = new Set<string>();
        for (const winner of recentWinners) {
            for (const player of winner.team.players) {
                recentWinnerIds.add(player.id);
            }
        }

        // Filter out recent winners
        const candidatesWithoutWinners = candidates.filter(id => !recentWinnerIds.has(id));
        if (candidatesWithoutWinners.length > 0) {
            candidates = candidatesWithoutWinners;
        }
    }

    // Step 3: Calculate losses for candidates and weight selection
    const transactions = await prisma.transaction.findMany({
        where: {
            playerId: { in: candidates },
        },
        select: { playerId: true, type: true, amount: true, description: true },
    });

    // Calculate loss (entry fees - prizes) for each candidate
    const lossMap = new Map<string, number>();
    for (const playerId of candidates) {
        const playerTx = transactions.filter(tx => tx.playerId === playerId);
        let entryFees = 0;
        let prizes = 0;

        for (const tx of playerTx) {
            if (tx.type === "debit" && tx.description.toLowerCase().includes("entry")) {
                entryFees += tx.amount;
            } else if (tx.type === "credit" && tx.description.toLowerCase().includes("prize")) {
                prizes += tx.amount;
            }
        }

        const loss = Math.max(0, entryFees - prizes);
        lossMap.set(playerId, loss);
    }

    // Sort candidates by loss (highest first)
    const sortedByLoss = [...candidates].sort((a, b) =>
        (lossMap.get(b) || 0) - (lossMap.get(a) || 0)
    );

    // Build weighted pool - higher loss = more entries
    // Players with losses get extra weight, top losers get most weight
    const weightedPool: string[] = [];
    for (let i = 0; i < sortedByLoss.length; i++) {
        const playerId = sortedByLoss[i];
        const loss = lossMap.get(playerId) || 0;

        // Weight: everyone gets 1 entry, + bonus based on loss
        // Top 3 losers get extra weight (3x, 2x, 1.5x)
        let weight = 1;
        if (loss > 0) {
            if (i === 0) weight = 3;
            else if (i === 1) weight = 2;
            else if (i === 2) weight = 1.5;
            else weight = 1 + (loss / 100); // Small bonus based on loss amount
        }

        const entries = Math.max(1, Math.floor(weight));
        for (let j = 0; j < entries; j++) {
            weightedPool.push(playerId);
        }
    }

    // Use pollId as seed for deterministic random selection
    const seed = pollId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomIndex = seed % weightedPool.length;

    return weightedPool[randomIndex];
}

/**
 * Record a player as the lucky voter for a season (called after team creation is confirmed)
 */
export async function recordLuckyVoter(playerId: string, seasonId: string): Promise<void> {
    const luckyVotersJson = await getAppSetting("luckyVotersBySeason");
    const luckyVotersBySeason: Record<string, string[]> = luckyVotersJson
        ? JSON.parse(luckyVotersJson)
        : {};

    // Add player to this season's lucky voters
    if (!luckyVotersBySeason[seasonId]) {
        luckyVotersBySeason[seasonId] = [];
    }

    // Only add if not already in the list
    if (!luckyVotersBySeason[seasonId].includes(playerId)) {
        luckyVotersBySeason[seasonId].push(playerId);
    }

    await setAppSetting("luckyVotersBySeason", JSON.stringify(luckyVotersBySeason));
}

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
    displayName?: string | null;
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
    soloPlayers: { id: string; userName: string }[];
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

    // Count tournaments in current season (for season transition logic)
    const tournamentCountInSeason = await prisma.tournament.count({
        where: { seasonId },
    });

    // Get previous season for team balancing (first 5 tournaments use previous season stats)
    const currentSeason = await prisma.season.findUnique({
        where: { id: seasonId },
        select: { startDate: true },
    });

    let previousSeasonId: string | undefined;
    if (currentSeason) {
        const previousSeason = await prisma.season.findFirst({
            where: {
                startDate: { lt: currentSeason.startDate },
            },
            orderBy: { startDate: 'desc' },
            select: { id: true },
        });
        previousSeasonId = previousSeason?.id;
    }

    // Build season scoring config for team balancing
    const seasonScoringConfig: SeasonScoringConfig = {
        currentSeasonId: seasonId,
        previousSeasonId,
        tournamentCountInSeason,
    };

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
                    userName: p.user.displayName || p.user.userName,
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

    // Compute weighted scores with recent wins using season transition config
    // For first 5 tournaments of a new season, this uses previous season stats
    const playersWithScore: (PlayerWithWeightT & { recentWins: number })[] = players.map((p) => {
        const recentWins = recentWinsMap.get(p.id) ?? 0;
        const playerWithWins: PlayerWithWins = { ...p, recentWins };
        return {
            ...p,
            recentWins,
            weightedScore: computeWeightedScore(playerWithWins, seasonScoringConfig),
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

    // Get previous teammates to avoid back-to-back pairing (lookback 1 tournament)
    const previousTeammates = await getPreviousTournamentTeammates(
        seasonId,
        tournamentId,
        playersForTeams.map(p => p.id),
        1 // Look back 1 tournament for back-to-back prevention
    );

    // Use balanced team creation for all modes - pair players from different skill tiers
    let teams: TeamStats[] = [];
    if (teamCount > 0) {
        if (groupSize === 2) {
            // Duo mode: pair strongest with weakest for balanced teams
            teams = createBalancedDuos(playersForTeams as unknown as PlayerWithWeightT[], seasonId, previousTeammates);
        } else if (groupSize === 3) {
            // Trio mode: combine one from each of 3 skill tiers
            teams = createBalancedTrios(playersForTeams as unknown as PlayerWithWeightT[], seasonId, previousTeammates);
        } else if (groupSize === 4) {
            // Quad mode: combine one from each of 4 skill tiers
            teams = createBalancedQuads(playersForTeams as unknown as PlayerWithWeightT[], seasonId, previousTeammates);
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
                displayName: p.user.displayName,
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
        soloPlayers: soloPlayers.map(p => ({ id: p.id, userName: p.user.userName })),
        entryFee,
        tournamentName: tournament?.name ?? "Unknown Tournament",
        totalPlayersEligible: players.length,
    };
}

