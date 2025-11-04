import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { SEASON_ENDPOINTS } from "@/src/lib/endpoints/season";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type SeasonT = Prisma.SeasonGetPayload<{ include: { player: true } }>;

export function useGetSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: () => http.get<SeasonT[]>(SEASON_ENDPOINTS.GET_SEASONS),
    select: (data) => data.data,
  });
}
