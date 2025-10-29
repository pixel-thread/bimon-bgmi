import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { PLAYER_ENDPOINTS } from "@/src/lib/endpoints/player";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type UsePlayerT = {
  id: string;
};

export function usePlayer({ id }: UsePlayerT) {
  const url = PLAYER_ENDPOINTS.GET_PLAYER_STATS_BY_ID.replace(":id", id);
  return useQuery({
    queryFn: () => http.get(url),
    queryKey: ["player", id],
    select: (data) => data.data,
    enabled: !!id,
  });
}
