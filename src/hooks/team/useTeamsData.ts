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
};

/**
 * Base hook for team data - Single Source of Truth
 * 
 * This hook is the foundation for all team-related data fetching.
 * Other hooks like useTeams and useStandings should consume this hook
 * to share the same cached data.
 */
export function useTeamsData({ page = "1", refetchOnWindowFocus = true, enabled = true }: Props = { page: "1" }) {
    const { isSuperAdmin } = useAuth();
    const { tournamentId } = useTournamentStore();
    const { matchId } = useMatchStore();

    const urlBase = isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID.replace(
            ":matchId",
            matchId
        ).replace(":page", page)
        : TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID;

    const url = urlBase.replace(":id", tournamentId).replace(":matchId", matchId);

    const query = useQuery({
        queryFn: () => http.get<TeamDataT[]>(url),
        queryKey: ["teams", tournamentId, matchId, page],
        enabled: enabled && !!tournamentId && !!matchId,
        select: (data) => data,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus,
        staleTime: 60 * 1000, // 1 minute - balance between freshness and performance
    });

    const meta = query?.data?.meta;

    return { ...query, data: query.data?.data, meta };
}
