import { PLAYER_ENDPOINTS } from "@/src/lib/endpoints/player";
import { useSeasonStore } from "@/src/store/season";
import { PlayerStatsT } from "@/src/types/player";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type UsePlayerT = {
  id: string;
  enabled?: boolean;
};

export function usePlayerStats({ id, enabled = true }: UsePlayerT) {
  const { seasonId } = useSeasonStore();
  const url = PLAYER_ENDPOINTS.GET_PLAYER_STATS_BY_ID.replace(
    ":id",
    id,
  ).replace(":season", seasonId);

  return useQuery({
    queryFn: () => http.get<PlayerStatsT>(url),
    queryKey: ["player stats", id, seasonId],
    select: (data) => data.data,
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, no refetch
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache longer
  });
}

