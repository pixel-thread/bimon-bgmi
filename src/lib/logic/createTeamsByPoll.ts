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
import { PlayerWithWeightT } from "@/types/models";
import { getPreviousTournamentTeammates } from "./previousTeammates";
import { isBirthdayWithinWindow } from "./birthdayCheck";
import { debitCentralWallet, getEmailByPlayerId } from "@/lib/wallet-service";

// ─── Types ───────────────────────────────────────────────────

type PreviewTeamInput = {
    teamNumber: number;
    playerIds: string[];
};

type Props = {
    groupSize: 1 | 2 | 3 | 4;
    tournamentId: string;
    seasonId: string;
    pollId: string;
    entryFee?: number;
    previewTeams?: PreviewTeamInput[];
};

export type CreateTeamsByPollsResult = {
    teamsCreated: number;
    playersAssigned: number;
    matchId: string;
    entryFeeCharged: number;
};

// Helper to process promises in batches (PgBouncer safe)
async function processBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }
    return results;
}

// ─── Service ─────────────────────────────────────────────────

export async function createTeamsByPoll({
    groupSize,
    pollId,
    tournamentId,
    seasonId,
    entryFee = 0,
    previewTeams,
}: Props): Promise<CreateTeamsByPollsResult> {
    if (![1, 2, 3, 4].includes(groupSize)) {
        throw new Error("Invalid group size");
    }

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { name: true },
    });
    const tournamentName = tournament?.name ?? "Tournament";

    // Get lucky voter from the poll
    let luckyVoterId: string | null = null;
    if (pollId) {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: { luckyVoterId: true },
        });
        luckyVoterId = poll?.luckyVoterId || null;
    }

    // Season scoring config
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

    // Fetch eligible players
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

    // SOLO voters
    const playersWhoVotedSolo = players.filter((p) =>
        p.pollVotes.some((vote) => vote.pollId === pollId && vote.vote === "SOLO"),
    );

    // Compute weighted scores — map v2 stats format
    const playersWithScore = players.map((p) => {
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

    let teams: TeamStats[] = [];
    const BATCH_SIZE = 5;

    if (previewTeams && previewTeams.length > 0) {
        // Use confirmed preview teams
        const playerMap = new Map(playersWithScore.map((p) => [p.id, p]));

        for (const previewTeam of previewTeams) {
            const teamPlayers: any[] = [];
            for (const playerId of previewTeam.playerIds) {
                const player = playerMap.get(playerId);
                if (player) teamPlayers.push(player);
            }
            if (teamPlayers.length > 0) {
                const totalKills = teamPlayers.reduce((sum, p) => {
                    const stats = p.stats?.find((s: any) => s.seasonId === seasonId);
                    return sum + (stats?.kills ?? 0);
                }, 0);
                const weightedScore = teamPlayers.reduce((sum: number, p: any) => sum + (p.weightedScore ?? 0), 0);
                teams.push({
                    players: teamPlayers as unknown as PlayerWithWeightT[],
                    totalKills,
                    totalDeaths: 0,
                    totalWins: 0,
                    weightedScore,
                });
            }
        }
    } else {
        // Generate teams from scratch
        const soloPlayers: typeof playersWithScore = [];
        let playersForTeams: typeof playersWithScore = [];

        for (const p of playersWithScore) {
            const isSoloVoter = playersWhoVotedSolo.some((solo) => solo.id === p.id);
            const isSoloRestricted = (p as any).isSoloRestricted === true;
            if (isSoloVoter || isSoloRestricted) {
                soloPlayers.push(p);
            } else {
                playersForTeams.push(p);
            }
        }

        // Handle leftovers: form smaller balanced teams so everyone plays
        // Min team size = groupSize-1 (squads→trio, trios→duo)
        // Pick leftover players from across the skill spectrum
        let leftoverPlayers: typeof playersForTeams = [];
        const minTeamSize = Math.max(groupSize - 1, 1);

        if (groupSize > 1 && playersForTeams.length % groupSize !== 0) {
            let needed = playersForTeams.length % groupSize;
            // If remainder is too small, steal full teams to make it divisible by minTeamSize
            // e.g. squads rem 2: need 6 (2 trios); rem 1: need 9 (3 trios)
            while (needed > 0 && needed % minTeamSize !== 0) {
                needed += groupSize;
            }
            // Cap: don't take more than available
            needed = Math.min(needed, playersForTeams.length);

            // Pick evenly across skill tiers (like the main balancer: strongest + weakest paired)
            // This keeps legends in both leftover AND full-size teams for proper balancing
            const sorted = [...playersForTeams].sort((a, b) => b.weightedScore - a.weightedScore);
            const step = sorted.length / needed;
            const pickedIds = new Set<string>();
            for (let i = 0; i < needed; i++) {
                const idx = Math.min(Math.floor(i * step), sorted.length - 1);
                // Find nearest unpicked player
                let pickIdx = idx;
                while (pickedIds.has(sorted[pickIdx].id) && pickIdx < sorted.length - 1) pickIdx++;
                if (!pickedIds.has(sorted[pickIdx].id)) {
                    pickedIds.add(sorted[pickIdx].id);
                    leftoverPlayers.push(sorted[pickIdx]);
                }
            }
            playersForTeams = playersForTeams.filter((p) => !pickedIds.has(p.id));
        }

        playersForTeams = shuffle(playersForTeams);

        const teamCount = Math.floor(playersForTeams.length / groupSize);
        if (teamCount === 0 && soloPlayers.length === 0 && leftoverPlayers.length === 0) {
            throw new Error("Not enough players to form teams.");
        }

        if (teamCount > 0) {
            const previousTeammates = await getPreviousTournamentTeammates(
                seasonId,
                tournamentId,
                playersForTeams.map((p) => p.id),
                1,
            );
            const asWeighted = playersForTeams as unknown as PlayerWithWeightT[];
            if (groupSize === 2) teams = createBalancedDuos(asWeighted, seasonId, previousTeammates);
            else if (groupSize === 3) teams = createBalancedTrios(asWeighted, seasonId, previousTeammates);
            else if (groupSize === 4) teams = createBalancedQuads(asWeighted, seasonId, previousTeammates);
        }

        // Split leftover players into teams of minTeamSize
        if (leftoverPlayers.length > 0) {
            // Sort by score for balanced splitting
            leftoverPlayers.sort((a, b) => b.weightedScore - a.weightedScore);
            const leftoverTeamCount = Math.ceil(leftoverPlayers.length / minTeamSize);

            for (let t = 0; t < leftoverTeamCount; t++) {
                const teamMembers: typeof playersForTeams = [];
                // Snake-draft: distribute skill evenly across leftover teams
                for (let i = 0; i < leftoverPlayers.length; i++) {
                    const assignedTeam = i % leftoverTeamCount;
                    if (assignedTeam === t) teamMembers.push(leftoverPlayers[i]);
                }
                if (teamMembers.length > 0) {
                    const totalKills = teamMembers.reduce((sum, p) => {
                        const stats = p.stats?.find((s: any) => s.seasonId === seasonId);
                        return sum + (stats?.kills ?? 0);
                    }, 0);
                    const weightedScore = teamMembers.reduce((sum: number, p: any) => sum + (p.weightedScore ?? 0), 0);
                    teams.push({
                        players: teamMembers as unknown as PlayerWithWeightT[],
                        totalKills,
                        totalDeaths: 0,
                        totalWins: 0,
                        weightedScore,
                    });
                }
            }
        }

        // Solo teams
        for (const soloPlayer of soloPlayers) {
            const stats = soloPlayer.stats.find((s) => s.seasonId === seasonId);
            teams.push({
                players: [soloPlayer as unknown as PlayerWithWeightT],
                totalKills: stats?.kills ?? 0,
                totalDeaths: 0,
                totalWins: 0,
                weightedScore: soloPlayer.weightedScore,
            });
        }

        analyzeTeamBalance(teams);
        teams = shuffle(teams);
    }

    // Validate
    const allTeamPlayerIds = new Set(teams.flatMap((t) => t.players.map((p) => p.id)));
    if (luckyVoterId && !allTeamPlayerIds.has(luckyVoterId)) {
        luckyVoterId = null;
    }

    // Track players to charge (populated inside transaction, used after)
    let playersToChargeList: any[] = [];

    // Persist in transaction
    const result = await prisma.$transaction(
        async (tx) => {
            // Create match
            const existingMatchCount = await tx.match.count({ where: { tournamentId } });
            const match = await tx.match.create({
                data: { tournamentId, seasonId, matchNumber: existingMatchCount + 1 },
            });

            // Create teams in batches
            const createdTeamData: { teamId: string; originalTeam: TeamStats }[] = [];

            for (let i = 0; i < teams.length; i += BATCH_SIZE) {
                const batch = teams.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map((t, batchIdx) => {
                    const teamIdx = i + batchIdx;
                    return tx.team.create({
                        data: {
                            name: `Team ${teamIdx + 1}`,
                            teamNumber: teamIdx + 1,
                            tournamentId,
                            seasonId,
                            players: { connect: t.players.map((p) => ({ id: p.id })) },
                            matches: { connect: { id: match.id } },
                        },
                        select: { id: true },
                    });
                });
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach((team, batchIdx) => {
                    createdTeamData.push({ teamId: team.id, originalTeam: batch[batchIdx] });
                });
            }

            // Create TeamStats
            const teamStats = await processBatches(
                createdTeamData,
                BATCH_SIZE,
                ({ teamId }) =>
                    tx.teamStats.create({
                        data: {
                            teamId,
                            matchId: match.id,
                            seasonId,
                            tournamentId,
                        },
                    }),
            );

            const allPlayers = teams.flatMap((t) => t.players);

            // Upsert PlayerStats
            await processBatches(allPlayers, BATCH_SIZE, (player) =>
                tx.playerStats.upsert({
                    where: {
                        seasonId_playerId: { playerId: player.id, seasonId },
                    },
                    create: { playerId: player.id, seasonId, kills: 0, matches: 0, kd: 0 },
                    update: {},
                }),
            );

            // Mark players to charge (skip lucky voter, birthday, UC-exempt)
            // Actual debit happens AFTER the transaction commits (see below)
            if (entryFee > 0) {
                const birthdayPlayerIds = new Set<string>();
                for (const player of allPlayers) {
                    const dateOfBirth = (player as any).user?.dateOfBirth;
                    if (dateOfBirth && isBirthdayWithinWindow(dateOfBirth)) {
                        birthdayPlayerIds.add(player.id);
                    }
                }

                playersToChargeList = allPlayers.filter(
                    (player) =>
                        !player.isUCExempt &&
                        player.id !== luckyVoterId &&
                        !birthdayPlayerIds.has(player.id),
                );
            }

            // Create MatchPlayerPlayed entries
            const matchPlayerPlayedData = createdTeamData.flatMap(({ teamId, originalTeam }) =>
                originalTeam.players.map((player) => ({
                    matchId: match.id,
                    playerId: player.id,
                    tournamentId,
                    seasonId,
                    teamId,
                })),
            );
            await tx.matchPlayerPlayed.createMany({ data: matchPlayerPlayedData });

            // Connect teamStats to players and players to match
            for (let i = 0; i < createdTeamData.length; i += BATCH_SIZE) {
                const batchEnd = Math.min(i + BATCH_SIZE, createdTeamData.length);
                const promises: Promise<unknown>[] = [];

                for (let j = i; j < batchEnd; j++) {
                    const { originalTeam } = createdTeamData[j];
                    const teamStat = teamStats[j];

                    promises.push(
                        tx.teamStats.update({
                            where: { id: teamStat.id },
                            data: { players: { connect: originalTeam.players.map((p) => ({ id: p.id })) } },
                        }),
                    );

                    for (const player of originalTeam.players) {
                        promises.push(
                            tx.player.update({
                                where: { id: player.id },
                                data: { matches: { connect: { id: match.id } } },
                            }),
                        );
                    }
                }

                await Promise.all(promises);
            }

            return {
                matchId: match.id,
                teamsCreated: createdTeamData.length,
                playersAssigned: allTeamPlayerIds.size,
            };
        },
        {
            maxWait: 60000,
            timeout: 600000,
        },
    );

    // ── Post-transaction: debit central wallets ──────────────────
    // Must happen OUTSIDE the prisma transaction because central wallet
    // is a separate database (Neon). This ensures the game DB records
    // are committed before we debit.
    if (entryFee > 0 && playersToChargeList.length > 0) {
        await processBatches(playersToChargeList, BATCH_SIZE, async (player) => {
            const email = (player as any).user?.email || await getEmailByPlayerId(player.id);
            if (email) {
                try {
                    await debitCentralWallet(email, entryFee, `Entry fee for ${tournamentName}`, "TOURNAMENT_ENTRY");
                } catch (err) {
                    console.error(`[createTeamsByPoll] Failed to debit central wallet for ${player.id}:`, err);
                }
            }
        });
    }

    return {
        ...result,
        entryFeeCharged: entryFee,
    };
}
