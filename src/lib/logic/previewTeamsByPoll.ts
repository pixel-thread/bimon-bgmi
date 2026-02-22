import { prisma } from "@/lib/database";
import { shuffle } from "./shuffle";
import {
    createBalancedDuos,
    createBalancedTrios,
    createBalancedQuads,
    analyzeTeamBalance,
    TeamStats,
} from "./teamBalancer";
import { computeWeightedScore, PlayerWithWins, SeasonScoringConfig } from "./scoreUtil";
import { PlayerWithStatsT, PlayerWithWeightT } from "@/types/models";
import { getPreviousTournamentTeammates } from "./previousTeammates";
import { getCategoryFromKD, type PlayerTier } from "./categoryUtils";

// ─── Types ───────────────────────────────────────────────────

type Props = {
    groupSize: 1 | 2 | 3 | 4;
    tournamentId: string;
    seasonId: string;
    pollId: string;
    entryFee?: number;
};

export type TeamPreviewPlayer = {
    id: string;
    username: string;
    displayName?: string | null;
    balance: number;
    kills: number;
    kd: number;
    category: PlayerTier;
    weightedScore: number;
};

export type TeamPreview = {
    teamNumber: number;
    teamName: string;
    players: TeamPreviewPlayer[];
    totalKills: number;
    weightedScore: number;
};

export type PreviewTeamsByPollsResult = {
    teams: TeamPreview[];
    playersWithInsufficientBalance: { id: string; username: string; balance: number }[];
    soloPlayers: { id: string; username: string }[];
    entryFee: number;
    tournamentName: string;
    totalPlayersEligible: number;
};

// ─── Service ─────────────────────────────────────────────────

export async function previewTeamsByPoll({
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

    // Season scoring config (for new season transitions)
    const tournamentCountInSeason = await prisma.tournament.count({
        where: { seasonId },
    });

    const currentSeason = await prisma.season.findUnique({
        where: { id: seasonId },
        select: { startDate: true },
    });

    let previousSeasonId: string | undefined;
    if (currentSeason) {
        const previousSeason = await prisma.season.findFirst({
            where: { startDate: { lt: currentSeason.startDate } },
            orderBy: { startDate: "desc" },
            select: { id: true },
        });
        previousSeasonId = previousSeason?.id;
    }

    const seasonScoringConfig: SeasonScoringConfig = {
        currentSeasonId: seasonId,
        previousSeasonId,
        tournamentCountInSeason,
    };

    // Fetch eligible players: voted IN or SOLO (not OUT), not banned
    const players = await prisma.player.findMany({
        where: {
            isBanned: false,
            pollVotes: {
                some: {
                    pollId,
                    vote: { not: "OUT" },
                },
            },
        },
        include: {
            stats: true,
            pollVotes: true,
            user: true,
            wallet: true,
        },
    });

    if (players.length === 0) {
        throw new Error("No eligible players found for this poll.");
    }

    // Balance map
    const playerBalanceMap = new Map<string, number>();
    players.forEach((p) => {
        playerBalanceMap.set(p.id, p.wallet?.balance ?? 0);
    });

    // Track insufficient balance (info only — not excluded)
    const playersWithInsufficientBalance: { id: string; username: string; balance: number }[] = [];
    if (entryFee > 0) {
        players.forEach((p) => {
            const balance = p.wallet?.balance ?? 0;
            if (balance < entryFee) {
                playersWithInsufficientBalance.push({
                    id: p.id,
                    username: p.user.username,
                    balance,
                });
            }
        });
    }

    // SOLO voters
    const playersWhoVotedSolo = players.filter((p) =>
        p.pollVotes.some((vote) => vote.pollId === pollId && vote.vote === "SOLO"),
    );

    // Compute weighted scores — adapt stats to format expected by scoreUtil
    // The teamBalancer/scoreUtil use `playerStats` property name
    const playersWithScore = players.map((p) => {
        // Map v2 stats → playerStats shape expected by scoreUtil
        const playerStats = p.stats.map((s) => ({
            seasonId: s.seasonId,
            kills: s.kills,
            deaths: s.kd > 0 ? Math.round(s.kills / s.kd) : 0,
        }));

        const playerWithWins: PlayerWithWins = {
            ...p,
            playerStats: playerStats as any,
            recentWins: 0,
        } as any;

        return {
            ...p,
            playerStats: playerStats as any,
            weightedScore: computeWeightedScore(playerWithWins, seasonScoringConfig),
        };
    });

    // Separate solo from team players
    const soloPlayers: typeof playersWithScore = [];
    let playersForTeams: typeof playersWithScore = [];

    for (const p of playersWithScore) {
        if (playersWhoVotedSolo.some((solo) => solo.id === p.id)) {
            soloPlayers.push(p);
        } else {
            playersForTeams.push(p);
        }
    }

    // Vote timestamps for FIFO leftover handling
    const voteTimestampMap = new Map<string, Date>();
    for (const p of players) {
        const vote = p.pollVotes.find((v) => v.pollId === pollId && v.vote === "IN");
        if (vote) {
            voteTimestampMap.set(p.id, vote.createdAt);
        }
    }

    // Handle leftovers (when player count isn't divisible by group size)
    // Latest voters are excluded (FIFO)
    if (groupSize > 1 && playersForTeams.length % groupSize !== 0) {
        const leftoverCount = playersForTeams.length % groupSize;
        playersForTeams.sort((a, b) => {
            const timeA = voteTimestampMap.get(a.id)?.getTime() ?? 0;
            const timeB = voteTimestampMap.get(b.id)?.getTime() ?? 0;
            return timeB - timeA; // Latest first
        });
        for (let i = 0; i < leftoverCount; i++) {
            playersForTeams.shift();
        }
    }

    // Shuffle for variety
    playersForTeams = shuffle(playersForTeams);

    const teamCount = Math.floor(playersForTeams.length / groupSize);
    if (teamCount === 0 && soloPlayers.length === 0) {
        throw new Error("Not enough players to form teams.");
    }

    // Get previous teammates for back-to-back prevention
    const previousTeammates = await getPreviousTournamentTeammates(
        seasonId,
        tournamentId,
        playersForTeams.map((p) => p.id),
        1,
    );

    // Generate balanced teams
    let teams: TeamStats[] = [];
    if (teamCount > 0) {
        const asWeighted = playersForTeams as unknown as PlayerWithWeightT[];
        if (groupSize === 2) {
            teams = createBalancedDuos(asWeighted, seasonId, previousTeammates);
        } else if (groupSize === 3) {
            teams = createBalancedTrios(asWeighted, seasonId, previousTeammates);
        } else if (groupSize === 4) {
            teams = createBalancedQuads(asWeighted, seasonId, previousTeammates);
        }
    }

    // Add solo players as individual teams
    for (const soloPlayer of soloPlayers) {
        const stats = soloPlayer.stats.find((s) => s.seasonId === seasonId);
        teams.push({
            players: [soloPlayer as unknown as PlayerWithStatsT],
            totalKills: stats?.kills ?? 0,
            totalDeaths: 0,
            totalWins: 0,
            weightedScore: soloPlayer.weightedScore,
        });
    }

    analyzeTeamBalance(teams);
    teams = shuffle(teams);

    // Convert to preview format
    const teamPreviews: TeamPreview[] = teams.map((t, index) => {
        const teamPlayers: TeamPreviewPlayer[] = t.players.map((p: any) => {
            const stats = (p.stats || p.playerStats || []).find((s: any) => s.seasonId === seasonId);
            const kills = stats?.kills ?? 0;
            const kd = stats?.kd ?? (stats?.deaths > 0 ? kills / stats.deaths : kills > 0 ? kills : 0);

            return {
                id: p.id,
                username: p.user?.username ?? "Unknown",
                displayName: p.displayName,
                balance: playerBalanceMap.get(p.id) ?? 0,
                kills,
                kd: Math.round(kd * 100) / 100,
                category: getCategoryFromKD(kills, stats?.deaths ?? (kd > 0 ? Math.round(kills / kd) : 0)),
                weightedScore: (p as any).weightedScore ?? 0,
            };
        });

        return {
            teamNumber: index + 1,
            teamName: `Team ${index + 1}`,
            players: teamPlayers,
            totalKills: t.totalKills,
            weightedScore: t.weightedScore,
        };
    });

    return {
        teams: teamPreviews,
        playersWithInsufficientBalance,
        soloPlayers: soloPlayers.map((p) => ({ id: p.id, username: p.user.username })),
        entryFee,
        tournamentName: tournament?.name ?? "Unknown Tournament",
        totalPlayersEligible: players.length,
    };
}
