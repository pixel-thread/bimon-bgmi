import { useMemo } from "react";
import { useTeamsData, TeamDataT } from "./useTeamsData";
import { compareTiebreaker, TeamRankingData } from "@/src/utils/tournamentTiebreaker";
import { TeamT } from "@/src/types/team";

// Extended type that includes both TeamT and ranking fields
export type StandingTeamT = TeamT & {
    chickenDinners: number;
    placementPoints: number;
    totalKills: number;
    lastMatchPosition: number;
};

/**
 * Derived hook for standings - uses cached team data
 * 
 * This hook consumes useTeamsData and applies tiebreaker sorting client-side.
 * No additional API call is made since it shares the same React Query cache.
 */
export function useStandings() {
    const { data: teams, isFetching, isLoading, ...rest } = useTeamsData({ page: "all" });

    // Transform and sort teams for standings
    const standings = useMemo(() => {
        if (!teams || teams.length === 0) return [];

        // Create ranking data for sorting
        const teamsWithRanking = teams.map((team) => ({
            // Preserve all original TeamT fields
            ...team,
            // Add/compute ranking fields
            teamId: team.id,
            chickenDinners: team.chickenDinners || 0,
            placementPoints: team.pts || 0,
            totalKills: team.kills || 0,
            lastMatchPosition: team.lastMatchPosition || team.position || 99,
            total: team.total || (team.pts || 0) + (team.kills || 0),
            // Ensure matches is a number (count), not an array of Match objects
            matches: typeof team.matches === 'number' ? team.matches : ((team.matches as any)?.length ?? 1),
        }));

        // Sort using official BGMI tiebreaker rules
        return teamsWithRanking.sort((a, b) => compareTiebreaker(a as TeamRankingData, b as TeamRankingData));
    }, [teams]);

    return {
        data: standings as StandingTeamT[],
        isFetching,
        isLoading,
        ...rest,
    };
}
