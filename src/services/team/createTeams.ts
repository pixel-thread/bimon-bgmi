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

  // Extend players with weighted score
  // TODO: Add weighted score to PlayerT
  const playersWithScore: PlayerWithStats[] = players.map((p) => ({
    ...p,
    weightedScore: computeWeightedScore(p as PlayerWithStats),
  }));

  // Sort by score descending
  playersWithScore.sort((a, b) => b.weightedScore - a.weightedScore);

  // Calculate team counts
  const teamCount = Math.floor(playersWithScore.length / groupSize);
  const leftoverPlayers = playersWithScore.slice(teamCount * groupSize);

  if (teamCount === 0) throw new Error("Not enough players to form teams.");

  // Distribute players fairly (balanced)
  let teams = assignPlayersToTeamsBalanced(
    playersWithScore,
    teamCount,
    groupSize,
  );

  // Handle leftover players
  if (leftoverPlayers.length > 0) {
    leftoverPlayers.sort((a, b) => b.weightedScore - a.weightedScore);
    leftoverPlayers.forEach((p) => {
      const weakestTeam = teams.reduce((prev, curr) =>
        curr.weightedScore < prev.weightedScore ? curr : prev,
      );
      weakestTeam.players.push(p);
      weakestTeam.totalKills += p.playerStats?.kills ?? 0;
      weakestTeam.totalDeaths += p.playerStats?.deaths ?? 0;
      weakestTeam.totalWins += p.playerStats?.wins ?? 0;
      weakestTeam.weightedScore += p.weightedScore;
    });
  }

  // Analyze balance
  analyzeTeamBalance(teams);

  // Randomize order to avoid predictable numbering
  teams = shuffle(teams);

  // Persist teams
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

    // Update player team references
    await prisma.player.updateMany({
      where: { id: { in: t.players.map((p) => p.id) } },
      data: { teamId: team.id },
    });

    createdTeams.push(team);
  }

  return createdTeams;
}
