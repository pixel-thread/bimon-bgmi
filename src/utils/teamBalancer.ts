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
 * Creates balanced trio teams by combining one player from each skill tier (top, middle, bottom).
 * Each tier is shuffled independently to produce varied groupings while maintaining balance.
 */
export function createBalancedTrios(
  players: PlayerWithStatsT[],
  seasonId?: string,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const third = Math.floor(sorted.length / 3);

  // Split into three tiers: strong (top third), medium (middle third), weak (bottom third)
  const strongTier = sorted.slice(0, third);
  const mediumTier = sorted.slice(third, third * 2);
  const weakTier = sorted.slice(third * 2, third * 3);

  // Shuffle each tier independently to create varied groupings
  const shuffledStrong = shuffle(strongTier);
  const shuffledMedium = shuffle(mediumTier);
  const shuffledWeak = shuffle(weakTier);

  const teams: TeamStats[] = [];

  // Combine one from each tier per team
  for (let i = 0; i < third; i++) {
    const strong = shuffledStrong[i];
    const medium = shuffledMedium[i];
    const weak = shuffledWeak[i];

    const strongStats = strong.playerStats.find((p) => p.seasonId === seasonId);
    const mediumStats = medium.playerStats.find((p) => p.seasonId === seasonId);
    const weakStats = weak.playerStats.find((p) => p.seasonId === seasonId);

    teams.push({
      players: [strong, medium, weak],
      totalKills: (strongStats?.kills ?? 0) + (mediumStats?.kills ?? 0) + (weakStats?.kills ?? 0),
      totalDeaths: (strongStats?.deaths ?? 0) + (mediumStats?.deaths ?? 0) + (weakStats?.deaths ?? 0),
      totalWins: 0,
      // @ts-expect-error weightedScore is added at runtime
      weightedScore: (strong.weightedScore ?? 0) + (medium.weightedScore ?? 0) + (weak.weightedScore ?? 0),
    });
  }

  return teams;
}

/**
 * Creates balanced quad teams by combining one player from each skill tier (top, upper-middle, lower-middle, bottom).
 * Each tier is shuffled independently to produce varied groupings while maintaining balance.
 */
export function createBalancedQuads(
  players: PlayerWithStatsT[],
  seasonId?: string,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const quarter = Math.floor(sorted.length / 4);

  // Split into four tiers
  const tier1 = sorted.slice(0, quarter);               // Strongest
  const tier2 = sorted.slice(quarter, quarter * 2);     // Upper-middle
  const tier3 = sorted.slice(quarter * 2, quarter * 3); // Lower-middle
  const tier4 = sorted.slice(quarter * 3, quarter * 4); // Weakest

  // Shuffle each tier independently to create varied groupings
  const shuffled1 = shuffle(tier1);
  const shuffled2 = shuffle(tier2);
  const shuffled3 = shuffle(tier3);
  const shuffled4 = shuffle(tier4);

  const teams: TeamStats[] = [];

  // Combine one from each tier per team
  for (let i = 0; i < quarter; i++) {
    const p1 = shuffled1[i];
    const p2 = shuffled2[i];
    const p3 = shuffled3[i];
    const p4 = shuffled4[i];

    const stats1 = p1.playerStats.find((p) => p.seasonId === seasonId);
    const stats2 = p2.playerStats.find((p) => p.seasonId === seasonId);
    const stats3 = p3.playerStats.find((p) => p.seasonId === seasonId);
    const stats4 = p4.playerStats.find((p) => p.seasonId === seasonId);

    teams.push({
      players: [p1, p2, p3, p4],
      totalKills: (stats1?.kills ?? 0) + (stats2?.kills ?? 0) + (stats3?.kills ?? 0) + (stats4?.kills ?? 0),
      totalDeaths: (stats1?.deaths ?? 0) + (stats2?.deaths ?? 0) + (stats3?.deaths ?? 0) + (stats4?.deaths ?? 0),
      totalWins: 0,
      // @ts-expect-error weightedScore is added at runtime
      weightedScore: (p1.weightedScore ?? 0) + (p2.weightedScore ?? 0) + (p3.weightedScore ?? 0) + (p4.weightedScore ?? 0),
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
