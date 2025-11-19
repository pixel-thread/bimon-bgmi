import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";

export function useTeams() {
  const { isSuperAdmin } = useAuth();
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const urlBase = isSuperAdmin
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID
    : TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID;

  const url = urlBase.replace(":id", tournamentId).replace(":matchId", matchId);

  console.log("Fetching teams with URL:", url);

  return useQuery({
    queryFn: () => http.get<TeamT[]>(url),
    queryKey: ["teams", tournamentId, matchId],
    enabled: !!tournamentId && !!matchId,
    select: (data) => data?.data,
  });
}
