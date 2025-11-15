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
};

export async function createTeamsByPolls({
  groupSize,
  pollId,
  tournamentId,
  seasonId,
}: Props) {
  if (![1, 2, 3, 4].includes(groupSize)) {
    throw new Error("Invalid group size");
  }

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
    },
  });

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
      totalWins: soloStats?.wins ?? 0,
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

      const result = [];

      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];

        // Create Team
        const team = await tx.team.create({
          data: {
            name: `Team ${i + 1}`,
            teamNumber: i + 1,
            tournamentId,
            seasonId,
            players: {
              connect: t.players.map((p) => ({ id: p.id })),
            },
            matches: {
              connect: { id: match.id },
            },
          },
          include: { players: true },
        });

        const teamStat = await tx.teamStats.create({
          data: {
            teamId: team.id,
            matchId: match.id,
            seasonId,
            tournamentId,
          },
        });

        for (const player of t.players) {
          await tx.player.update({
            where: { id: player.id },
            data: {
              teamStats: { connect: { id: teamStat.id || "" } },
            },
          });

          await tx.teamPlayerStats.create({
            data: {
              teamId: team.id || "",
              matchId: match.id || "",
              seasonId: seasonId,
              playerId: player.id || "",
              teamStatsId: teamStat.id || "",
            },
          });
        }

        await tx.matchPlayerPlayed.create({
          data: {
            matchId: match.id || "",
            playerId: team.players[0].id || "",
            tournamentId: tournamentId,
            seasonId: seasonId,
            teamId: team.id,
          },
        });

        result.push(team);
      }

      return result;
    },
    {
      maxWait: 10000, // Max wait to connect to Prisma (10 seconds)
      timeout: 30000, // Transaction timeout (30 seconds)
    },
  );

  return createdTeams;
}
