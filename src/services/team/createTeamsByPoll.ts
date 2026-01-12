import { prisma } from "@/src/lib/db/prisma";
import { shuffle } from "@/src/utils/shuffle";
import {
  createBalancedDuos,
  createBalancedTrios,
  createBalancedQuads,
  analyzeTeamBalance,
  TeamStats,
} from "@/src/utils/teamBalancer";
import { computeWeightedScore, PlayerWithWins } from "@/src/utils/scoreUtil";
import { PlayerWithWeightT } from "@/src/types/player";
import { getPreviousTournamentTeammates } from "@/src/utils/previousTeammates";

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
  previewTeams?: PreviewTeamInput[]; // If provided, use these exact team arrangements
};

export type CreateTeamsByPollsResult = {
  teams: Awaited<ReturnType<typeof prisma.team.create>>[];
  playersWithInsufficientBalance: { id: string; userName: string; balance: number }[];
  entryFeeCharged: number;
};

// Helper to process promises in batches to avoid overwhelming PgBouncer
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

export async function createTeamsByPolls({
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

  // Get tournament name for transaction description
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true },
  });
  const tournamentName = tournament?.name ?? "Tournament";

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

  // Filter players who voted SOLO in THIS poll - they will be solo
  // Important: Only check the vote for the current pollId, not all historical votes
  const playersWhoVotedSolo = players.filter((p) =>
    p.playerPollVote.some((vote) => vote.pollId === pollId && vote.vote === "SOLO"),
  );

  // Compute weighted scores (without wins for actual creation - wins are factored in preview)
  const playersWithScore: PlayerWithWeightT[] = players.map((p) => {
    const playerWithWins: PlayerWithWins = { ...p, recentWins: 0 };
    return {
      ...p,
      weightedScore: computeWeightedScore(playerWithWins, seasonId),
    };
  });

  // Use duo pair optimization for groupSize 2, snake draft otherwise
  let teams: TeamStats[] = [];

  // If previewTeams is provided, use those exact team arrangements
  if (previewTeams && previewTeams.length > 0) {
    // Build teams from preview data
    const playerMap = new Map(playersWithScore.map(p => [p.id, p]));

    for (const previewTeam of previewTeams) {
      const teamPlayers: PlayerWithWeightT[] = [];
      for (const playerId of previewTeam.playerIds) {
        const player = playerMap.get(playerId);
        if (player) {
          teamPlayers.push(player);
        }
      }

      if (teamPlayers.length > 0) {
        const totalKills = teamPlayers.reduce((sum, p) => {
          const stats = p.playerStats.find(s => s.seasonId === seasonId);
          return sum + (stats?.kills ?? 0);
        }, 0);
        const totalDeaths = teamPlayers.reduce((sum, p) => {
          const stats = p.playerStats.find(s => s.seasonId === seasonId);
          return sum + (stats?.deaths ?? 0);
        }, 0);
        const weightedScore = teamPlayers.reduce((sum, p) => sum + p.weightedScore, 0);

        teams.push({
          players: teamPlayers,
          totalKills,
          totalDeaths,
          totalWins: 0,
          weightedScore,
        });
      }
    }
  } else {
    // Generate teams normally (when no preview is provided)
    // Separate solo voters from team players
    const soloPlayers: PlayerWithWeightT[] = [];
    let playersForTeams: PlayerWithWeightT[] = [];

    // All SOLO voters go to solo teams
    // Also, players with isSoloRestricted=true (low merit) must play solo
    for (const p of playersWithScore) {
      const isSoloVoter = playersWhoVotedSolo.some((solo) => solo.id === p.id);
      const isSoloRestricted = (p as any).isSoloRestricted === true;

      if (isSoloVoter || isSoloRestricted) {
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

    // Shuffle players to produce different team compositions (matches preview behavior)
    playersForTeams = shuffle(playersForTeams);

    const teamCount = Math.floor(playersForTeams.length / groupSize);
    if (teamCount === 0 && soloPlayers.length === 0) {
      throw new Error("Not enough players to form teams.");
    }

    if (teamCount > 0) {
      // Get previous teammates to avoid back-to-back pairing (lookback 1 tournament)
      const previousTeammates = await getPreviousTournamentTeammates(
        seasonId,
        tournamentId,
        playersForTeams.map(p => p.id),
        1 // Look back 1 tournament for back-to-back prevention
      );

      if (groupSize === 2) {
        teams = createBalancedDuos(playersForTeams, seasonId, previousTeammates);
      } else if (groupSize === 3) {
        teams = createBalancedTrios(playersForTeams, seasonId, previousTeammates);
      } else if (groupSize === 4) {
        teams = createBalancedQuads(playersForTeams, seasonId, previousTeammates);
      }
    }

    // Add all solo players as individual teams
    for (const soloPlayer of soloPlayers) {
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
  }

  // Batch size for parallel operations - keep low for PgBouncer compatibility
  const BATCH_SIZE = 5;

  // Persist all in a transaction atomically
  const createdTeams = await prisma.$transaction(
    async (tx) => {
      // Create a new Match for tournament and season
      const match = await tx.match.create({
        data: {
          tournamentId,
          seasonId,
        },
      });

      // Phase 1: Create teams in batches (not all at once to avoid PgBouncer issues)
      const createdTeamData: { team: Awaited<ReturnType<typeof tx.team.create>>, originalTeam: TeamStats }[] = [];

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
            include: { players: true },
          });
        });
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((team, batchIdx) => {
          createdTeamData.push({ team, originalTeam: batch[batchIdx] });
        });
      }

      // Phase 2: Create TeamStats in batches
      const teamStats = await processBatches(
        createdTeamData,
        BATCH_SIZE,
        ({ team }) => tx.teamStats.create({
          data: {
            teamId: team.id,
            matchId: match.id,
            seasonId,
            tournamentId,
          },
        })
      );

      const allPlayers = teams.flatMap((t) => t.players);

      // Phase 3: Upsert PlayerStats in batches
      await processBatches(
        allPlayers,
        BATCH_SIZE,
        (player) => tx.playerStats.upsert({
          where: {
            seasonId_playerId: {
              playerId: player.id,
              seasonId: seasonId,
            },
          },
          create: {
            playerId: player.id,
            seasonId: seasonId,
            kills: 0,
            deaths: 0,
          },
          update: {},
        })
      );

      // Phase 4: Debit UC from non-exempt players
      if (entryFee > 0) {
        const playersToCharge = allPlayers.filter((player) => !player.isUCExempt);

        if (playersToCharge.length > 0) {
          // Record transaction history in bulk
          await tx.transaction.createMany({
            data: playersToCharge.map((player) => ({
              amount: entryFee,
              type: "debit",
              description: `Entry fee for ${tournamentName}`,
              playerId: player.id,
            })),
          });

          // UC decrements in batches
          await processBatches(
            playersToCharge,
            BATCH_SIZE,
            (player) => tx.uC.upsert({
              where: { playerId: player.id },
              create: {
                balance: -entryFee,
                player: { connect: { id: player.id } },
                user: { connect: { id: player.userId } },
              },
              update: {
                balance: { decrement: entryFee },
              },
            })
          );
        }
      }

      // Phase 5: Create MatchPlayerPlayed entries (bulk insert - efficient)
      const matchPlayerPlayedData: {
        matchId: string;
        playerId: string;
        tournamentId: string;
        seasonId: string;
        teamId: string;
      }[] = [];

      for (const { team, originalTeam } of createdTeamData) {
        for (const player of originalTeam.players) {
          matchPlayerPlayedData.push({
            matchId: match.id,
            playerId: player.id,
            tournamentId,
            seasonId,
            teamId: team.id,
          });
        }
      }

      await tx.matchPlayerPlayed.createMany({
        data: matchPlayerPlayedData,
      });

      // Phase 6: Connect teamStats to players and players to match in batches
      for (let i = 0; i < createdTeamData.length; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, createdTeamData.length);
        const batchPromises: Promise<unknown>[] = [];

        for (let j = i; j < batchEnd; j++) {
          const { originalTeam } = createdTeamData[j];
          const teamStat = teamStats[j];

          // Connect teamStats to players
          batchPromises.push(
            tx.teamStats.update({
              where: { id: teamStat.id },
              data: {
                players: { connect: originalTeam.players.map((p) => ({ id: p.id })) },
              },
            })
          );

          // Connect each player to the match
          for (const player of originalTeam.players) {
            batchPromises.push(
              tx.player.update({
                where: { id: player.id },
                data: {
                  matches: { connect: { id: match.id } },
                },
              })
            );
          }
        }

        await Promise.all(batchPromises);
      }

      return createdTeamData.map(({ team }) => team);
    },
    {
      maxWait: 60000, // Max wait to connect to Prisma (60 seconds)
      timeout: 600000, // Transaction timeout (10 minutes - match global config)
    },
  );

  return {
    teams: createdTeams,
    playersWithInsufficientBalance,
    entryFeeCharged: entryFee,
  };
}
