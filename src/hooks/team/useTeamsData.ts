import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";

export type TeamDataT = TeamT & {
    chickenDinners?: number;
    placementPoints?: number;
    totalKills?: number;
    lastMatchPosition?: number;
};

type Props = {
    page?: string;
    refetchOnWindowFocus?: boolean;
    enabled?: boolean;
    compareMatches?: number; // How many matches back to compare for position changes (default: 2)
};

/**
 * Base hook for team data - Single Source of Truth
 * 
 * This hook is the foundation for all team-related data fetching.
 * Other hooks like useTeams and useStandings should consume this hook
 * to share the same cached data.
 */
export function useTeamsData({ page = "1", refetchOnWindowFocus = true, enabled = true, compareMatches = 2 }: Props = { page: "1" }) {
    const { isSuperAdmin } = useAuth();
    const { tournamentId } = useTournamentStore();
    const { matchId } = useMatchStore();

    const urlBase = isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID.replace(
            ":matchId",
            matchId
        ).replace(":page", page)
        : TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID;

    // Add compareMatches parameter to URL
    const baseUrl = urlBase.replace(":id", tournamentId).replace(":matchId", matchId);
    const url = baseUrl.includes("?")
        ? `${baseUrl}&compareMatches=${compareMatches}`
        : `${baseUrl}?compareMatches=${compareMatches}`;

    const query = useQuery({
        queryFn: () => http.get<TeamDataT[]>(url),
        queryKey: ["teams", tournamentId, matchId, page, compareMatches],
        enabled: enabled && !!tournamentId && !!matchId,
        select: (data) => data,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus,
        staleTime: 5 * 60 * 1000, // 5 minutes - reduces refetches when switching matches
    });

    const meta = query?.data?.meta;

    return { ...query, data: query.data?.data, meta };
}
