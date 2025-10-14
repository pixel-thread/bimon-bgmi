import { PlayerWithStats } from "../types/player";

export type TeamStats = {
  players: PlayerWithStats[];
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  weightedScore: number;
};

/**
 * Balanced (snake draft) distribution of players into teams.
 * Ensures stronger players are spread evenly.
 */
export function assignPlayersToTeamsBalanced(
  players: PlayerWithStats[],
  teamCount: number,
  groupSize: number,
): TeamStats[] {
  // Initialize empty teams
  const teams: TeamStats[] = Array.from({ length: teamCount }, () => ({
    players: [],
    totalKills: 0,
    totalDeaths: 0,
    totalWins: 0,
    weightedScore: 0,
  }));

  let direction = 1; // 1 = forward, -1 = backward
  let teamIdx = 0;

  for (let i = 0; i < teamCount * groupSize; i++) {
    const player = players[i];
    const team = teams[teamIdx];

    team.players.push(player);
    team.totalKills += player.playerStats?.kills ?? 0;
    team.totalDeaths += player.playerStats?.deaths ?? 0;
    team.totalWins += player.playerStats?.wins ?? 0;
    team.weightedScore += player.weightedScore;

    // Move index in snake pattern
    teamIdx += direction;
    if (teamIdx >= teamCount) {
      teamIdx = teamCount - 1;
      direction = -1;
    } else if (teamIdx < 0) {
      teamIdx = 0;
      direction = 1;
    }
  }

  return teams;
}

/**
 * Checks how balanced the teams are based on weighted scores.
 */
export function analyzeTeamBalance(teams: TeamStats[]): void {
  const avg = teams.reduce((sum, t) => sum + t.weightedScore, 0) / teams.length;

  const maxVariance = avg * 0.15; // Allow 15% deviation

  const imbalanced = teams.filter(
    (t) => Math.abs(t.weightedScore - avg) > maxVariance,
  );

  if (imbalanced.length > 0) {
    console.warn(
      "⚠️ Some teams are outside the balance threshold:",
      imbalanced.map((t) => t.weightedScore.toFixed(2)),
    );
  }
}
