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

export type CreateTeamsByPollsResult = {
  teams: Awaited<ReturnType<typeof prisma.team.create>>[];
  playersWithInsufficientBalance: { id: string; userName: string; balance: number }[];
  entryFeeCharged: number;
};

export async function createTeamsByPolls({
  groupSize,
  pollId,
  tournamentId,
  seasonId,
  entryFee = 0,
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

  // Filter players who voted SOLO - they will ALWAYS be solo
  const playersWhoVotedSolo = players.filter((p) =>
    p.playerPollVote.some((vote) => vote.vote === "SOLO"),
  );

  // Compute weighted scores (without wins for actual creation - wins are factored in preview)
  const playersWithScore: PlayerWithWeightT[] = players.map((p) => {
    const playerWithWins: PlayerWithWins = { ...p, recentWins: 0 };
    return {
      ...p,
      weightedScore: computeWeightedScore(playerWithWins, seasonId),
    };
  });

  // Separate solo voters from team players
  const soloPlayers: PlayerWithWeightT[] = [];
  let playersForTeams: PlayerWithWeightT[] = [];

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

  const teamCount = Math.floor(playersForTeams.length / groupSize);
  if (teamCount === 0 && soloPlayers.length === 0) {
    throw new Error("Not enough players to form teams.");
  }

  // Use duo pair optimization for groupSize 2, snake draft otherwise
  let teams: TeamStats[] = [];
  if (teamCount > 0) {
    if (groupSize === 2) {
      teams = createBalancedDuos(playersForTeams, seasonId);
    } else {
      teams = assignPlayersToTeamsBalanced(
        playersForTeams,
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

      // Phase 1: Create all teams first
      const createdTeamData = [];
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const team = await tx.team.create({
          data: {
            name: `Team ${i + 1}`,
            teamNumber: i + 1,
            tournamentId,
            seasonId,
            players: { connect: t.players.map((p) => ({ id: p.id })) },
            matches: { connect: { id: match.id } },
          },
          include: { players: true },
        });
        createdTeamData.push({ team, originalTeam: t });
      }

      // Phase 2: Create all TeamStats in batch
      const teamStatPromises = createdTeamData.map(({ team }) =>
        tx.teamStats.create({
          data: {
            teamId: team.id,
            matchId: match.id,
            seasonId,
            tournamentId,
          },
        })
      );
      const teamStats = await Promise.all(teamStatPromises);

      // Phase 3: Batch create TeamPlayerStats using createMany
      const teamPlayerStatsData: {
        teamId: string;
        matchId: string;
        seasonId: string;
        playerId: string;
        teamStatsId: string;
        kills: number;
        deaths: number;
      }[] = [];

      for (let i = 0; i < createdTeamData.length; i++) {
        const { team, originalTeam } = createdTeamData[i];
        const teamStat = teamStats[i];

        for (const player of originalTeam.players) {
          teamPlayerStatsData.push({
            teamId: team.id,
            matchId: match.id,
            seasonId,
            playerId: player.id,
            teamStatsId: teamStat.id,
            kills: 0,
            deaths: 1,
          });
        }
      }

      // Batch insert all TeamPlayerStats
      await tx.teamPlayerStats.createMany({
        data: teamPlayerStatsData,
      });

      // Phase 4: Update player stats and UC in parallel batches per team
      const allPlayers = teams.flatMap((t) => t.players);

      // Batch upsert PlayerStats
      const playerStatsPromises = allPlayers.map((player) =>
        tx.playerStats.upsert({
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
            deaths: 1,
          },
          update: {
            deaths: { increment: 1 },
          },
        })
      );
      await Promise.all(playerStatsPromises);

      // Phase 5: Debit UC from non-exempt players in batch + record transactions
      if (entryFee > 0) {
        // Filter out UC-exempt players
        const playersToCharge = allPlayers.filter((player) => !player.isUCExempt);

        if (playersToCharge.length > 0) {
          // Record transaction history first
          await tx.transaction.createMany({
            data: playersToCharge.map((player) => ({
              amount: entryFee,
              type: "debit",
              description: `Entry fee for ${tournamentName}`,
              playerId: player.id,
            })),
          });

          // Then debit UC
          const ucPromises = playersToCharge.map((player) =>
            tx.uC.upsert({
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
          await Promise.all(ucPromises);
        }
      }

      // Phase 6: Create MatchPlayerPlayed entries for ALL players
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

      // Phase 7: Connect players to match and teamStats
      for (let i = 0; i < createdTeamData.length; i++) {
        const { originalTeam } = createdTeamData[i];
        const teamStat = teamStats[i];

        // Connect teamStats to players
        await tx.teamStats.update({
          where: { id: teamStat.id },
          data: {
            players: { connect: originalTeam.players.map((p) => ({ id: p.id })) },
          },
        });

        // Connect each player to the match
        for (const player of originalTeam.players) {
          await tx.player.update({
            where: { id: player.id },
            data: {
              matches: { connect: { id: match.id } },
            },
          });
        }
      }

      return createdTeamData.map(({ team }) => team);
    },
    {
      maxWait: 30000, // Max wait to connect to Prisma (30 seconds)
      timeout: 300000, // Transaction timeout (5 minutes for 64+ players)
    },
  );

  return {
    teams: createdTeams,
    playersWithInsufficientBalance,
    entryFeeCharged: entryFee,
  };
}
