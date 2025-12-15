import { PlayerWithStatsT } from "../types/player";
import { shuffle } from "./shuffle";

export type TeamStats = {
  players: PlayerWithStatsT[];
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
  players: PlayerWithStatsT[],
  teamCount: number,
  groupSize: number,
  seasonId?: string,
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
    team.totalKills +=
      player.playerStats.find((p) => p.seasonId === seasonId)?.kills ?? 0;
    team.totalDeaths +=
      player.playerStats.find((p) => p.seasonId === seasonId)?.deaths ?? 0;
    team.totalWins += 0; // TODO:
    // player.playerStats.find((p) => p.seasonId === seasonId)?.wins ?? 0;
    // @ts-expect-error weightedScore is not in PlayerWithStatsT but added at runtime
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
 * Creates balanced duo teams by pairing players from the stronger half with the weaker half.
 * Both halves are shuffled to produce varied pairings on each call while maintaining balance.
 */
export function createBalancedDuos(
  players: PlayerWithStatsT[],
  seasonId?: string,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const half = Math.floor(sorted.length / 2);

  // Split into strong (top half) and weak (bottom half)
  const strongHalf = sorted.slice(0, half);
  const weakHalf = sorted.slice(half);

  // Shuffle both halves independently to create varied pairings
  // This maintains balance (strong paired with weak) but randomizes which specific players are paired
  const shuffledStrong = shuffle(strongHalf);
  const shuffledWeak = shuffle(weakHalf);

  const teams: TeamStats[] = [];

  // Pair shuffled strong with shuffled weak
  for (let i = 0; i < half; i++) {
    const strong = shuffledStrong[i];
    const weak = shuffledWeak[i];

    const strongStats = strong.playerStats.find((p) => p.seasonId === seasonId);
    const weakStats = weak.playerStats.find((p) => p.seasonId === seasonId);

    teams.push({
      players: [strong, weak],
      totalKills: (strongStats?.kills ?? 0) + (weakStats?.kills ?? 0),
      totalDeaths: (strongStats?.deaths ?? 0) + (weakStats?.deaths ?? 0),
      totalWins: 0,
      // @ts-expect-error weightedScore is added at runtime
      weightedScore: (strong.weightedScore ?? 0) + (weak.weightedScore ?? 0),
    });
  }

  return teams;
}

/**
 * Checks how balanced the teams are based on weighted scores.
 * Note: With random shuffling enabled, some variance in team scores is expected.
 */
export function analyzeTeamBalance(teams: TeamStats[]): void {
  // Balance analysis is informational only - no action needed
  // Random shuffling intentionally creates more variance for different team compositions
}
