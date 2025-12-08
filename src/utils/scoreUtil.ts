import { PlayerWithStatsT } from "../types/player";
import { getCategoryFromKD, getCategoryScore } from "./categoryUtils";

/**
 * Extended player type with recent wins for team balancing.
 */
export type PlayerWithWins = PlayerWithStatsT & {
  recentWins?: number;
};

/**
 * Computes a weighted score for a player based on KD, category, and recent wins.
 * Weights: 50% KD + 30% Category + 20% Recent Wins
 */
export function computeWeightedScore(
  p: PlayerWithWins,
  seasonId?: string
): number {
  const id = seasonId || "";
  const stats = p.playerStats.find((s) => s.seasonId === id);
  const kills = stats?.kills ?? 0;
  const deaths = stats?.deaths ?? 1; // Avoid div by 0

  // KD score (normalized 0-100, capped at KD of 3.0)
  const kd = kills / deaths;
  const kdScore = Math.min(kd / 3.0, 1) * 100;

  // Category score (0-100)
  const category = getCategoryFromKD(kills, deaths);
  const categoryScore = getCategoryScore(category);

  // Wins score (each win = 15 points, capped at 100)
  // 1st = 2 points, 2nd = 1 point (from recentWins calculation)
  const winsScore = Math.min((p.recentWins ?? 0) * 15, 100);

  // Weighted formula: 50% KD + 30% Category + 20% Wins
  return kdScore * 0.5 + categoryScore * 0.3 + winsScore * 0.2;
}

/**
 * Legacy function for backward compatibility.
 * Same as computeWeightedScore but without wins.
 */
export function computeWeightedScoreLegacy(
  p: PlayerWithStatsT,
  seasonId?: string
): number {
  const id = seasonId || "";
  const stats = p.playerStats.find((s: { seasonId?: string | null }) => s.seasonId === id);
  const kills = stats?.kills ?? 0;
  const deaths = stats?.deaths ?? 1;

  const kd = kills / deaths;
  const kdScore = Math.min(kd / 3.0, 1) * 100;

  const category = getCategoryFromKD(kills, deaths);
  const categoryScore = getCategoryScore(category);

  // Without wins, redistribute weights: 60% KD + 40% Category
  return kdScore * 0.6 + categoryScore * 0.4;
}
