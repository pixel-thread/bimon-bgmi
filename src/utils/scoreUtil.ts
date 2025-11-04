import { PlayerT } from "../types/player";

/**
 * Computes a weighted score for a player based on KD, kills, and wins.
 */
export function computeWeightedScore(p: PlayerT, seasonId?: string): number {
  const id = seasonId || "";
  const kd = p.playerStats.find((p) => p.seasonId === id)?.kd ?? 0;
  const kills = p.playerStats.find((p) => p.seasonId === id)?.kills ?? 0;
  const wins = p.playerStats.find((p) => p.seasonId === id)?.wins ?? 0;

  const weightKD = 0.6;
  const weightKills = 0.3;
  const weightWins = 0.1;

  return kd * weightKD + kills * weightKills + wins * weightWins;
}
