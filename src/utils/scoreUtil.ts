import { PlayerT, PlayerWithStats } from "../types/player";

/**
 * Computes a weighted score for a player based on KD, kills, and wins.
 */
export function computeWeightedScore(p: PlayerWithStats | PlayerT): number {
  const kd = p.playerStats?.kd ?? 0;
  const kills = p.playerStats?.kills ?? 0;
  const wins = p.playerStats?.wins ?? 0;

  const weightKD = 0.6;
  const weightKills = 0.3;
  const weightWins = 0.1;

  return kd * weightKD + kills * weightKills + wins * weightWins;
}
