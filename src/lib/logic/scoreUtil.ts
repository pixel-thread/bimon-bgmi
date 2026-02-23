import { PlayerWithStatsT } from "@/types/models";
import { getCategoryFromKD, getCategoryScore } from "./categoryUtils";

interface PlayerStat {
  seasonId?: string | null;
  kills: number;
  kd: number;
}

/**
 * Extended player type with recent wins for team balancing.
 */
export type PlayerWithWins = PlayerWithStatsT & {
  recentWins?: number;
};

/**
 * Configuration for season transition scoring
 */
export type SeasonScoringConfig = {
  currentSeasonId: string;
  previousSeasonId?: string;
  tournamentCountInSeason?: number; // How many tournaments have been played in current season
};

/**
 * Computes a weighted score for a player based on KD and recent wins.
 * Weights: 70% KD + 30% Recent Wins
 * 
 * For new seasons (first 5 tournaments), uses previous season stats if available.
 * Falls back to current season stats if player has no previous season data.
 */
export function computeWeightedScore(
  p: PlayerWithWins,
  seasonIdOrConfig?: string | SeasonScoringConfig
): number {
  let stats;

  if (typeof seasonIdOrConfig === 'object') {
    const { currentSeasonId, previousSeasonId, tournamentCountInSeason = 0 } = seasonIdOrConfig;

    // Use previous season stats for first 5 tournaments of a new season
    if (tournamentCountInSeason < 5 && previousSeasonId) {
      // Try previous season first
      stats = p.stats.find((s: PlayerStat) => s.seasonId === previousSeasonId);

      // If no stats in previous season, find most recent season with actual data
      if (!stats || (stats.kills === 0 && stats.kd === 0)) {
        const seasonWithStats = p.stats
          .filter((s: PlayerStat) => s.seasonId !== currentSeasonId && (s.kills > 0 || s.kd > 0))
          .sort((a: PlayerStat, b: PlayerStat) => {
            return (b.kills + b.kd) - (a.kills + a.kd);
          })[0];

        if (seasonWithStats) {
          stats = seasonWithStats;
        } else {
          stats = p.stats.find((s: PlayerStat) => s.seasonId === currentSeasonId);
        }
      }
    } else {
      stats = p.stats.find((s: PlayerStat) => s.seasonId === currentSeasonId);
    }
  } else {
    const id = seasonIdOrConfig || "";
    stats = p.stats.find((s: PlayerStat) => s.seasonId === id);
  }

  const kd = stats?.kd ?? 0;

  // KD score (normalized 0-100, capped at KD of 3.0)
  const kdScore = Math.min(kd / 3.0, 1) * 100;

  // Wins score (each win = 15 points, capped at 100)
  const winsScore = Math.min((p.recentWins ?? 0) * 15, 100);

  // Weighted formula: 70% KD + 30% Wins
  return kdScore * 0.7 + winsScore * 0.3;
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
  const stats = p.stats.find((s: { seasonId?: string | null }) => s.seasonId === id);
  const kills = stats?.kills ?? 0;
  const kd = stats?.kd ?? 0;

  const kdScore = Math.min(kd / 3.0, 1) * 100;

  const category = getCategoryFromKD(kills, kills > 0 ? kills / (kd || 1) : 0);
  const categoryScore = getCategoryScore(category);

  // Without wins, redistribute weights: 60% KD + 40% Category
  return kdScore * 0.6 + categoryScore * 0.4;
}
