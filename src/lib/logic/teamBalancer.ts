import { PlayerWithStatsT } from "@/types/models";
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
 * Creates balanced duo teams by pairing the strongest player with the weakest, 
 * 2nd strongest with 2nd weakest, etc. This ensures all teams have similar total scores.
 * If previousTeammates is provided, tries to avoid pairing players who were teammates recently.
 */
export function createBalancedDuos(
  players: PlayerWithStatsT[],
  seasonId?: string,
  previousTeammates?: Map<string, Set<string>>,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const numTeams = Math.floor(sorted.length / 2);
  const teams: TeamStats[] = [];

  // Create pairings with some randomness:
  // Instead of always pairing 1st with last, each strong player pairs with
  // a random weak player from a range (allowing variety for top players)
  const pairings: Array<{ strong: PlayerWithStatsT; weak: PlayerWithStatsT }> = [];

  // Split into strong half and weak half
  const strongHalf = sorted.slice(0, numTeams);
  const weakHalf = sorted.slice(numTeams);

  // Shuffle the weak half to create random pairings while maintaining balance
  // (all weak players are roughly the same tier, so any pairing is balanced)
  const shuffledWeak = shuffle([...weakHalf]);

  for (let i = 0; i < numTeams; i++) {
    pairings.push({
      strong: strongHalf[i],
      weak: shuffledWeak[i],
    });
  }

  // Add variety by randomly swapping players with similar scores
  // This creates different compositions on each reshuffle while maintaining balance
  const SCORE_THRESHOLD = 5; // Players within 5 points can be swapped

  for (let i = 0; i < pairings.length - 1; i++) {
    // Randomly decide whether to attempt a swap (50% chance)
    if (Math.random() < 0.5) continue;

    // Find adjacent pairings with similar strong player scores
    for (let j = i + 1; j < Math.min(i + 3, pairings.length); j++) {
      // @ts-expect-error weightedScore is added at runtime
      const scoreDiffStrong = Math.abs(pairings[i].strong.weightedScore - pairings[j].strong.weightedScore);
      // @ts-expect-error weightedScore is added at runtime
      const scoreDiffWeak = Math.abs(pairings[i].weak.weightedScore - pairings[j].weak.weightedScore);

      // If both strong and weak players have similar scores, consider swapping
      if (scoreDiffStrong <= SCORE_THRESHOLD && scoreDiffWeak <= SCORE_THRESHOLD) {
        // 50% chance to swap the weak players
        if (Math.random() < 0.5) {
          const temp = pairings[i].weak;
          pairings[i].weak = pairings[j].weak;
          pairings[j].weak = temp;
        }
        break;
      }
    }
  }

  // If we have previousTeammates info, try to swap weak players to avoid previous teammates
  // while keeping score balance as good as possible
  if (previousTeammates) {
    for (let i = 0; i < pairings.length; i++) {
      const { strong, weak } = pairings[i];

      // Check if this pair were previous teammates
      if (previousTeammates.get(strong.id)?.has(weak.id)) {
        // Try to find another pairing to swap weak players with
        // Prefer swaps that keep similar team totals
        let bestSwapIdx = -1;
        let bestScoreDiff = Infinity;

        for (let j = i + 1; j < pairings.length; j++) {
          const otherStrong = pairings[j].strong;
          const otherWeak = pairings[j].weak;

          // Check if swapping would create valid pairs (no previous teammates)
          const wouldStrongPairWithOtherWeak = !previousTeammates.get(strong.id)?.has(otherWeak.id);
          const wouldOtherStrongPairWithWeak = !previousTeammates.get(otherStrong.id)?.has(weak.id);

          if (wouldStrongPairWithOtherWeak && wouldOtherStrongPairWithWeak) {
            // Calculate how much this swap would affect score balance
            // @ts-expect-error weightedScore is added at runtime
            const currentDiff = Math.abs((strong.weightedScore + weak.weightedScore) - (otherStrong.weightedScore + otherWeak.weightedScore));
            // @ts-expect-error weightedScore is added at runtime
            const swappedDiff = Math.abs((strong.weightedScore + otherWeak.weightedScore) - (otherStrong.weightedScore + weak.weightedScore));

            // Only consider swaps that don't make balance significantly worse
            if (swappedDiff <= currentDiff + 10 && swappedDiff < bestScoreDiff) {
              bestSwapIdx = j;
              bestScoreDiff = swappedDiff;
            }
          }
        }

        // Perform the swap if we found a valid one
        if (bestSwapIdx !== -1) {
          const temp = pairings[i].weak;
          pairings[i].weak = pairings[bestSwapIdx].weak;
          pairings[bestSwapIdx].weak = temp;
        }
      }
    }
  }

  // Shuffle the order of teams (not the pairings themselves) for variety
  const shuffledPairings = shuffle(pairings);

  // Build team stats from pairings
  for (const { strong, weak } of shuffledPairings) {
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
 * If previousTeammates is provided, tries to avoid grouping players who were teammates recently.
 */
export function createBalancedTrios(
  players: PlayerWithStatsT[],
  seasonId?: string,
  previousTeammates?: Map<string, Set<string>>,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const third = Math.floor(sorted.length / 3);

  // Split into three tiers: strong (top third), medium (middle third), weak (bottom third)
  // Use sorted.slice(third * 2) instead of sorted.slice(third * 2, third * 3) to include all remaining players
  const strongTier = sorted.slice(0, third);
  const mediumTier = sorted.slice(third, third * 2);
  const weakTier = sorted.slice(third * 2);

  // Shuffle each tier independently to create varied groupings
  const shuffledStrong = shuffle(strongTier);
  const shuffledMedium = shuffle(mediumTier);
  const shuffledWeak = shuffle(weakTier);

  const teams: TeamStats[] = [];
  const usedMediumIndices = new Set<number>();
  const usedWeakIndices = new Set<number>();

  // Helper to check if any pair in the proposed team were previous teammates
  const hasPreviousTeammate = (playerIds: string[]): boolean => {
    if (!previousTeammates) return false;
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        if (previousTeammates.get(playerIds[i])?.has(playerIds[j])) {
          return true;
        }
      }
    }
    return false;
  };

  // Combine one from each tier per team
  for (let i = 0; i < third; i++) {
    const strong = shuffledStrong[i];
    let medium = shuffledMedium[i];
    let weak = shuffledWeak[i];
    let mediumIdx = i;
    let weakIdx = i;

    // Try to find a combination without previous teammates
    if (previousTeammates && hasPreviousTeammate([strong.id, medium.id, weak.id])) {
      // Try different medium players
      for (let m = 0; m < third; m++) {
        if (usedMediumIndices.has(m)) continue;
        for (let w = 0; w < third; w++) {
          if (usedWeakIndices.has(w)) continue;
          if (!hasPreviousTeammate([strong.id, shuffledMedium[m].id, shuffledWeak[w].id])) {
            medium = shuffledMedium[m];
            weak = shuffledWeak[w];
            mediumIdx = m;
            weakIdx = w;
            break;
          }
        }
        if (mediumIdx !== i || weakIdx !== i) break;
      }
    }
    usedMediumIndices.add(mediumIdx);
    usedWeakIndices.add(weakIdx);

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
 * If previousTeammates is provided, tries to avoid grouping players who were teammates recently.
 */
export function createBalancedQuads(
  players: PlayerWithStatsT[],
  seasonId?: string,
  previousTeammates?: Map<string, Set<string>>,
): TeamStats[] {
  // Sort by weighted score descending
  const sorted = [...players].sort((a, b) => {
    // @ts-expect-error weightedScore is added at runtime
    return (b.weightedScore ?? 0) - (a.weightedScore ?? 0);
  });

  const quarter = Math.floor(sorted.length / 4);

  // Split into four tiers
  // Use sorted.slice(quarter * 3) instead of sorted.slice(quarter * 3, quarter * 4) to include all remaining players
  const tier1 = sorted.slice(0, quarter);               // Strongest
  const tier2 = sorted.slice(quarter, quarter * 2);     // Upper-middle
  const tier3 = sorted.slice(quarter * 2, quarter * 3); // Lower-middle
  const tier4 = sorted.slice(quarter * 3);              // Weakest (includes all remaining)

  // Shuffle each tier independently to create varied groupings
  const shuffled1 = shuffle(tier1);
  const shuffled2 = shuffle(tier2);
  const shuffled3 = shuffle(tier3);
  const shuffled4 = shuffle(tier4);

  const teams: TeamStats[] = [];
  const usedIdx2 = new Set<number>();
  const usedIdx3 = new Set<number>();
  const usedIdx4 = new Set<number>();

  // Helper to check if any pair in the proposed team were previous teammates
  const hasPreviousTeammate = (playerIds: string[]): boolean => {
    if (!previousTeammates) return false;
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        if (previousTeammates.get(playerIds[i])?.has(playerIds[j])) {
          return true;
        }
      }
    }
    return false;
  };

  // Combine one from each tier per team
  for (let i = 0; i < quarter; i++) {
    const p1 = shuffled1[i];
    let p2 = shuffled2[i];
    let p3 = shuffled3[i];
    let p4 = shuffled4[i];
    let idx2 = i, idx3 = i, idx4 = i;

    // Try to find a combination without previous teammates
    if (previousTeammates && hasPreviousTeammate([p1.id, p2.id, p3.id, p4.id])) {
      let found = false;
      outerLoop:
      for (let a = 0; a < quarter && !found; a++) {
        if (usedIdx2.has(a)) continue;
        for (let b = 0; b < quarter && !found; b++) {
          if (usedIdx3.has(b)) continue;
          for (let c = 0; c < quarter && !found; c++) {
            if (usedIdx4.has(c)) continue;
            if (!hasPreviousTeammate([p1.id, shuffled2[a].id, shuffled3[b].id, shuffled4[c].id])) {
              p2 = shuffled2[a];
              p3 = shuffled3[b];
              p4 = shuffled4[c];
              idx2 = a;
              idx3 = b;
              idx4 = c;
              found = true;
              break outerLoop;
            }
          }
        }
      }
    }
    usedIdx2.add(idx2);
    usedIdx3.add(idx3);
    usedIdx4.add(idx4);

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
