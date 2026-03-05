import { GAME } from "@/lib/game-config";

/**
 * Tournament Tiebreaker System
 * 
 * BGMI/PUBG Mobile tiebreaker rules:
 * (a) Total times of winning first placement (chicken dinners)
 * (b) Total accumulated placement points
 * (c) Total accumulated finishes (kills)
 * (d) Placement in the most recent match
 * 
 * Free Fire FFWS/FFIC tiebreaker rules:
 * (a) Total number of Booyahs (1st place finishes)
 * (b) Total accumulated kills
 * (c) Best placement in the most recent match
 */

export type TeamRankingData = {
    teamId: string;
    name: string;
    total: number;           // Total points (placement + kills)
    chickenDinners: number;  // Count of position === 1 (AKA booyahs in FF)
    placementPoints: number; // Sum of placement points only (not kills)
    totalKills: number;      // Sum of kills
    lastMatchPosition: number; // Position in most recent match (lower is better)
    matches: number;
    players?: { id: string; name: string }[];
};

/**
 * Compare two teams using official tiebreaker rules (game-aware).
 * Returns negative if a ranks higher, positive if b ranks higher.
 */
export function compareTiebreaker(a: TeamRankingData, b: TeamRankingData): number {
    // Primary: Total points (higher is better)
    if (b.total !== a.total) {
        return b.total - a.total;
    }

    // Tiebreaker 1: Chicken Dinners / Booyahs (higher is better)
    if (b.chickenDinners !== a.chickenDinners) {
        return b.chickenDinners - a.chickenDinners;
    }

    if (GAME.scoringSystem === "ffws") {
        // Free Fire: Booyahs → Kills → Recent Position
        if (b.totalKills !== a.totalKills) {
            return b.totalKills - a.totalKills;
        }
        return a.lastMatchPosition - b.lastMatchPosition;
    }

    // BGMI: Chicken Dinners → Placement Points → Kills → Recent Position
    if (b.placementPoints !== a.placementPoints) {
        return b.placementPoints - a.placementPoints;
    }

    if (b.totalKills !== a.totalKills) {
        return b.totalKills - a.totalKills;
    }

    return a.lastMatchPosition - b.lastMatchPosition;
}

/**
 * Sort teams using official tiebreaker rules.
 */
export function sortTeamsByTiebreaker(teams: TeamRankingData[]): TeamRankingData[] {
    return [...teams].sort(compareTiebreaker);
}
