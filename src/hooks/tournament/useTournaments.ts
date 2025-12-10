import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { TournamentT } from "@/src/types/tournament";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useSeasonStore } from "@/src/store/season";

export function useTournaments() {
  const { seasonId } = useSeasonStore();
  const { isSuperAdmin } = useAuth();
  const urlBase =
    seasonId === "all"
      ? isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_ALL_TOURNAMENTS
        : TOURNAMENT_ENDPOINTS.GET_ALL_TOURNAMENTS
      : isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMNTS_BY_SEASON_ID
        : TOURNAMENT_ENDPOINTS.GET_TOURNAMNTS_BY_SEASON_ID;

  const url = urlBase.replace(":id", seasonId);
  return useQuery({
    queryKey: ["tournaments", seasonId],
    queryFn: async () => await http.get<TournamentT[]>(url),
    select: (data) => {
      // Natural sort: properly handles numbers in names (e.g., "1, 2, 10" instead of "1, 10, 2")
      return data.data?.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    },
    enabled: !!seasonId,
    refetchOnWindowFocus: false,
  });
}
