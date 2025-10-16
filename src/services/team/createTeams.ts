import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "../tournament/getTournamentById";
import { getActiveSeason } from "../season/getActiveSeason";
import { shuffle } from "@/src/utils/shuffle";
import {
  assignPlayersToTeamsBalanced,
  analyzeTeamBalance,
} from "@/src/utils/teamBalancer";
import { PlayerWithStats } from "@/src/types/player";
import { computeWeightedScore } from "@/src/utils/scoreUtil";

type Props = {
  groupSize: 1 | 2 | 3 | 4;
  tournamentId: string;
  seasonId: string | null;
};

export async function createTeams({
  groupSize,
  tournamentId,
  seasonId,
}: Props) {
  if (![1, 2, 3, 4].includes(groupSize)) {
    throw new Error("Invalid group size");
  }

  // Get tournament and season
  const tournament = await getTournamentById({ id: tournamentId });
  const season =
    seasonId !== null
      ? await prisma.season.findUnique({ where: { id: seasonId } })
      : await getActiveSeason();

  // Fetch eligible players
  let players = await prisma.player.findMany({
    where: { isBanned: false },
    include: { playerStats: true },
  });

  // Compute weighted score
  const playersWithScore: PlayerWithStats[] = players.map((p) => ({
    ...p,
    weightedScore: computeWeightedScore(p as PlayerWithStats),
  }));

  // Sort by weightedScore DESC
  playersWithScore.sort((a, b) => b.weightedScore - a.weightedScore);

  // Handle leftover solo player
  const remainder = playersWithScore.length % groupSize;
  let soloPlayer: PlayerWithStats | null = null;

  if (remainder === 1 && groupSize > 1) {
    // Find highest KD player
    playersWithScore.sort((a, b) => {
      const aKD =
        a.playerStats?.deaths && a.playerStats.deaths > 0
          ? a.playerStats.kills / a.playerStats.deaths
          : (a.playerStats?.kills ?? 0);
      const bKD =
        b.playerStats?.deaths && b.playerStats.deaths > 0
          ? b.playerStats.kills / b.playerStats.deaths
          : (b.playerStats?.kills ?? 0);
      return bKD - aKD;
    });

    soloPlayer = playersWithScore.shift()!; // Remove top KD player
  }

  // Calculate number of balanced teams
  const teamCount = Math.floor(playersWithScore.length / groupSize);

  if (teamCount === 0) throw new Error("Not enough players to form teams.");

  // Assign players to balanced teams
  let teams = assignPlayersToTeamsBalanced(
    playersWithScore,
    teamCount,
    groupSize,
  );

  // Add solo player as own team
  if (soloPlayer) {
    teams.push({
      players: [soloPlayer],
      totalKills: soloPlayer.playerStats?.kills ?? 0,
      totalDeaths: soloPlayer.playerStats?.deaths ?? 0,
      totalWins: soloPlayer.playerStats?.wins ?? 0,
      weightedScore: soloPlayer.weightedScore,
    });
  }

  // Analyze team balance
  analyzeTeamBalance(teams);

  // Shuffle order to randomize display
  teams = shuffle(teams);

  // Persist teams in DB
  const createdTeams = [];
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const team = await prisma.team.create({
      data: {
        name: `${season?.name ?? "Season"}-${tournament?.name ?? "Tournament"}-Team ${i + 1}`,
        teamNumber: i + 1,
        seasonId: season?.id ?? null,
        tournamentId,
        players: {
          connect: t.players.map((p) => ({ id: p.id })),
        },
      },
      include: { players: { include: { playerStats: true } } },
    });

    await prisma.player.updateMany({
      where: { id: { in: t.players.map((p) => p.id) } },
      data: { teamId: team.id },
    });

    createdTeams.push(team);
  }

  return createdTeams;
}
