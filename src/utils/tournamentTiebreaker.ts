/**
 * Tournament Tiebreaker System
 * 
 * Official BGMI/PUBG Mobile tiebreaker rules:
 * (a) Total times of winning first placement (chicken dinners)
 * (b) Total accumulated placement points
 * (c) Total accumulated finishes (kills)
 * (d) Placement in the most recent match
 */

export type TeamRankingData = {
    teamId: string;
    name: string;
    total: number;           // Total points (placement + kills)
    chickenDinners: number;  // Count of position === 1
    placementPoints: number; // Sum of placement points only (not kills)
    totalKills: number;      // Sum of kills
    lastMatchPosition: number; // Position in most recent match (lower is better)
    matches: number;
    players?: { id: string; name: string }[];
};

/**
 * Compare two teams using official BGMI tiebreaker rules.
 * Returns negative if a ranks higher, positive if b ranks higher.
 */
export function compareTiebreaker(a: TeamRankingData, b: TeamRankingData): number {
    // Primary: Total points (higher is better)
    if (b.total !== a.total) {
        return b.total - a.total;
    }

    // (a) Chicken dinners - total times winning 1st place (higher is better)
    if (b.chickenDinners !== a.chickenDinners) {
        return b.chickenDinners - a.chickenDinners;
    }

    // (b) Placement points - accumulated placement points only (higher is better)
    if (b.placementPoints !== a.placementPoints) {
        return b.placementPoints - a.placementPoints;
    }

    // (c) Total finishes/kills (higher is better)
    if (b.totalKills !== a.totalKills) {
        return b.totalKills - a.totalKills;
    }

    // (d) Most recent match position (lower is better)
    return a.lastMatchPosition - b.lastMatchPosition;
}

/**
 * Sort teams using official BGMI tiebreaker rules.
 */
export function sortTeamsByTiebreaker(teams: TeamRankingData[]): TeamRankingData[] {
    return [...teams].sort(compareTiebreaker);
}
