import { prisma } from "@/src/lib/db/prisma";
import { shuffle } from "@/src/utils/shuffle";
import {
    assignPlayersToTeamsBalanced,
    analyzeTeamBalance,
} from "@/src/utils/teamBalancer";
import { computeWeightedScore } from "@/src/utils/scoreUtil";
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

    // Track players with insufficient balance if entry fee is required
    const playersWithInsufficientBalance: { id: string; userName: string; balance: number }[] = [];

    if (entryFee > 0) {
        // Filter out players who don't have enough UC balance
        const eligiblePlayers = players.filter((p) => {
            const balance = p.uc?.balance ?? 0;
            if (balance < entryFee) {
                playersWithInsufficientBalance.push({
                    id: p.id,
                    userName: p.user.userName,
                    balance,
                });
                return false;
            }
            return true;
        });
        players = eligiblePlayers;
    }

    // Fetch eligible players who voted in the poll and are not banned
    if (players.length === 0) {
        throw new Error("No eligible players found for this poll.");
    }

    // Filter players who voted SOLO
    const playersWhoVotedSolo = players.filter((p) =>
        p.playerPollVote.some((vote) => vote.vote === "SOLO"),
    );

    // Compute weighted scores
    const playersWithScore: PlayerWithWeightT[] = players.map((p) => ({
        ...p,
        // @ts-expect-error weightedScore is added at runtime
        weightedScore: computeWeightedScore(p),
    }));

    const remainder = playersWithScore.length % groupSize;

    let soloPlayer: PlayerWithWeightT | null = null;
    let playersForTeams: PlayerWithWeightT[] = [];

    if (remainder === 1 && groupSize > 1 && playersWhoVotedSolo.length > 0) {
        // Sort solo voters by KD descending
        const soloWithScores = playersWithScore.filter((p) =>
            playersWhoVotedSolo.some((solo) => solo.id === p.id),
        );

        soloWithScores.sort((a, b) => {
            const getKD = (player: typeof a) => {
                const stats = player.playerStats.find((p) => p.seasonId === seasonId);
                if (stats?.deaths && stats?.deaths > 0) {
                    return stats?.kills / stats?.deaths;
                }
                return (
                    player.playerStats.find((p) => p.seasonId === seasonId)?.kills ?? 0
                );
            };
            return getKD(b) - getKD(a);
        });

        soloPlayer = soloWithScores[0];

        // Exclude the solo player from team groupings
        playersForTeams = playersWithScore.filter((p) => p.id !== soloPlayer!.id);
    } else {
        playersForTeams = playersWithScore;
    }

    // Sort by weighted score descending
    playersForTeams.sort((a, b) => b.weightedScore - a.weightedScore);

    const teamCount = Math.floor(playersForTeams.length / groupSize);
    if (teamCount === 0) throw new Error("Not enough players to form teams.");

    // Assign balanced teams
    let teams = assignPlayersToTeamsBalanced(
        playersForTeams,
        teamCount,
        groupSize,
    );

    // Include solo player team if present
    if (soloPlayer) {
        const soloStats = soloPlayer.playerStats.find(
            (p) => p.seasonId === seasonId,
        );
        teams.push({
            players: [soloPlayer],
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

            return {
                id: p.id,
                userName: p.user.userName,
                balance: playerBalanceMap.get(p.id) ?? 0,
                kills,
                deaths,
                kd: Math.round(kd * 100) / 100,
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

