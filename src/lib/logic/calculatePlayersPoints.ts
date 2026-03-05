import { GAME } from "@/lib/game-config";

/**
 * BGMI placement points (official PUBG Mobile rules)
 * 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1, 9th+=0
 */
const BGMI_PLACEMENT: Record<number, number> = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
};

/**
 * Free Fire placement points (FFWS/FFIC official rules)
 * 1st=12 (Booyah!), 2nd=9, 3rd=8, 4th=7, 5th=6, 6th=5, 7th=4, 8th=3, 9th=2, 10th=1
 */
const FF_PLACEMENT: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};

export function calculatePlayerPoints(position: number, kills: number): number {
  const table = GAME.scoringSystem === "ffws" ? FF_PLACEMENT : BGMI_PLACEMENT;
  const positionPoints = table[position] ?? 0;
  const killPoints = kills;
  return positionPoints + killPoints;
}

/**
 * Get placement points only (without kills) — used for tiebreaker calculations
 */
export function getPlacementPoints(position: number): number {
  const table = GAME.scoringSystem === "ffws" ? FF_PLACEMENT : BGMI_PLACEMENT;
  return table[position] ?? 0;
}

// Re-export from unified category utils for backward compatibility
export { getKdRank } from "./categoryUtils";
