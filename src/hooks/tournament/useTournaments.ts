import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { TournamentT } from "@/src/types/tournament";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { useAuth } from "../useAuth";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useSeasonStore } from "@/src/store/season";

export function useTournaments() {
  const { seasonId } = useSeasonStore();
  const { isSuperAdmin } = useAuth();
  const url =
    seasonId === "all"
      ? isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_ALL_TOURNAMENTS
        : TOURNAMENT_ENDPOINTS.GET_ALL_TOURNAMENTS
      : isSuperAdmin
        ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMNTS_BY_SEASON_ID.replace(
            ":id",
            seasonId || "",
          )
        : TOURNAMENT_ENDPOINTS.GET_TOURNAMNTS_BY_SEASON_ID.replace(
            ":id",
            seasonId || "",
          );

  return useQuery({
    queryKey: ["tournaments", seasonId],
    queryFn: () => http.get<TournamentT[]>(url),
    select: (data) => data.data,
    enabled: !!seasonId,
  });
}
