import { PLAYER_ENDPOINTS } from "@/src/lib/endpoints/player";
import { useSeasonStore } from "@/src/store/season";
import { PlayerStatsT } from "@/src/types/player";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type UsePlayerT = {
  id: string;
};

export function usePlayerStats({ id }: UsePlayerT) {
  const { seasonId } = useSeasonStore();
  const url = PLAYER_ENDPOINTS.GET_PLAYER_STATS_BY_ID.replace(
    ":id",
    id,
  ).replace(":season", seasonId);

  return useQuery({
    queryFn: () => http.get<PlayerStatsT>(url),
    queryKey: ["player stats", id],
    select: (data) => data.data,
    enabled: !!id,
  });
}
