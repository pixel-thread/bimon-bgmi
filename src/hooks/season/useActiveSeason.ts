import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { SEASON_ENDPOINTS } from "@/src/lib/endpoints/season";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type SeasonT = Prisma.SeasonGetPayload<{}>;

export function useActiveSeason() {
  return useQuery({
    queryKey: ["seasons", "active"],
    queryFn: () => http.get<SeasonT>(SEASON_ENDPOINTS.GET_ACTIVE_SEASON),
    select: (data) => data.data,
  });
}
