import { useTournamentStore } from "@/src/store/tournament";
import { MatchT } from "@/src/types/match";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";

export function useMatches() {
  const { tournamentId } = useTournamentStore();
  const { isSuperAdmin } = useAuth();
  const url = isSuperAdmin
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_MATCHES.replace(
        ":id",
        tournamentId,
      )
    : TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_MATCHES.replace(":id", tournamentId);
  return useQuery({
    queryKey: ["match", tournamentId],
    queryFn: () => http.get<MatchT[]>(url),
    enabled: !!tournamentId,
    select: (data) => data.data,
  });
}
