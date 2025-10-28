import { prisma } from "@/src/lib/db/prisma";
import { shuffle } from "@/src/utils/shuffle";
import {
  assignPlayersToTeamsBalanced,
  analyzeTeamBalance,
} from "@/src/utils/teamBalancer";
import { computeWeightedScore } from "@/src/utils/scoreUtil";
import { PlayerT, PlayerWithWeightT } from "@/src/types/player";

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
  let players = [];
  // Fetch players who voted and are not banned
  // Development does not need to vote
  if (process.env.NODE_ENV !== "development") {
    players = await prisma.player.findMany({
      where: {
        isBanned: false,
        playerPollVote: {
          some: {
            pollId: pollId,
            vote: { not: "OUT" },
          },
        },
      },
      include: {
        playerStats: true,
        playerPollVote: true,
        user: true,
        characterImage: true,
      },
    });
  } else {
    players = await prisma.player.findMany({
      include: {
        playerStats: true,
        playerPollVote: true,
        user: true,
        characterImage: true,
      },
    });
  }

  if (players.length === 0) {
    throw new Error("No eligible players found for this poll.");
  }

  // Separate players by vote
  const playersWhoVotedSolo = players.filter((p) =>
    p.playerPollVote.some((vote) => vote.vote === "SOLO"),
  );

  // Compute weighted score for all players
  const playersWithScore: PlayerWithWeightT[] = players.map((p) => ({
    ...p,
    playerStats: p.playerStats,
    user: p.user,
    characterImage: p.characterImage,
    weightedScore: computeWeightedScore(p),
  }));

  // Calculate remainder for team formation
  const remainder = playersWithScore.length % groupSize;

  // Prepare arrays for team formation
  let soloPlayer: PlayerWithWeightT | null = null;
  let playersForTeams: PlayerWithWeightT[] = [];

  if (remainder === 1 && groupSize > 1 && playersWhoVotedSolo.length > 0) {
    // Pick solo player from playersWhoVotedSolo sorted by KD ratio descending

    const soloWithScores = playersWithScore.filter((p) =>
      playersWhoVotedSolo.some((solo) => solo.id === p.id),
    );

    soloWithScores.sort((a, b) => {
      const getKD = (player: PlayerT) => {
        if (player.playerStats?.deaths && player.playerStats.deaths > 0) {
          return player.playerStats.kills / player.playerStats.deaths;
        }
        return player.playerStats?.kills ?? 0;
      };
      return getKD(b) - getKD(a);
    });

    soloPlayer = soloWithScores[0];

    // Set playersForTeams as all excluding the chosen solo
    playersForTeams = playersWithScore.filter((p) => p.id !== soloPlayer!.id);
  } else {
    // No special solo player needed, all players are assigned to teams
    playersForTeams = playersWithScore;
  }

  // Sort playersForTeams by weighted score descending
  playersForTeams.sort((a, b) => b.weightedScore - a.weightedScore);

  // Calculate number of teams
  const teamCount = Math.floor(playersForTeams.length / groupSize);
  if (teamCount === 0) throw new Error("Not enough players to form teams.");

  // Assign balanced teams
  let teams = assignPlayersToTeamsBalanced(
    playersForTeams,
    teamCount,
    groupSize,
  );

  // Add solo player as single team if exists
  if (soloPlayer) {
    teams.push({
      players: [soloPlayer],
      totalKills: soloPlayer.playerStats?.kills ?? 0,
      totalDeaths: soloPlayer.playerStats?.deaths ?? 0,
      totalWins: soloPlayer.playerStats?.wins ?? 0,
      weightedScore: soloPlayer.weightedScore,
    });
  }

  // Analyze balance
  analyzeTeamBalance(teams);

  // Shuffle teams to randomize order
  teams = shuffle(teams);

  //  INFO: Remove when teams are persisted not needed
  // return teams;

  // Persist teams and update players using a transaction for atomicity
  const createdTeams = await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        tournamentId,
        seasonId,
      },
    });
    const result = [];
    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const team = await tx.team.create({
        data: {
          name: `Team ${i + 1}`,
          teamNumber: i + 1,
          players: { connect: t.players.map((p) => ({ id: p.id })) },
          tournamentId,
          seasonId,
          matches: { connect: { id: match.id } },
        },
        include: { players: true },
      });

      await tx.teamStats.create({
        data: {
          team: { connect: { id: team.id } },
          match: { connect: { id: match.id } },
          season: { connect: { id: seasonId } },
          tournament: { connect: { id: tournamentId } },
          teamPlayerStats: {
            create: t.players.map((p) => ({
              matchId: match.id,
              teamId: team.id,
              playerId: p.id,
            })),
          },
        },
      });

      await tx.player.updateMany({
        where: { id: { in: t.players.map((p) => p.id) } },
        data: { teamId: team.id },
      });

      result.push(team);
    }
    return result;
  });

  return createdTeams;
}
