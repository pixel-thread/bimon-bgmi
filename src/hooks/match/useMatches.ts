import { useTournamentStore } from "@/src/store/tournament";
import { MatchT } from "@/src/types/match";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useSeasonStore } from "@/src/store/season";

export function useMatches() {
  const { tournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const { isSuperAdmin } = useAuth();
  const urlBase = isSuperAdmin
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_MATCHES
    : TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_MATCHES;

  const url = urlBase.replace(":id", tournamentId);

  const query = useQuery({
    queryKey: ["match", seasonId, tournamentId],
    queryFn: async () => await http.get<MatchT[]>(url),
    enabled: !!tournamentId && !!seasonId,
    select: (data) => data.data,
    refetchOnWindowFocus: false,
    // Poll every 3s if any match is still processing
    refetchInterval: (query) => {
      const response = query.state.data;
      const matches = response?.data;
      const hasProcessing = matches?.some((m: MatchT) => m.status === "PROCESSING");
      return hasProcessing ? 3000 : false;
    },
  });

  return query;
}
