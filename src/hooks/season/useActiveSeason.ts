import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type SeasonT = Prisma.SeasonGetPayload<{}>;
export function useActiveSeason() {
  return useQuery({
    queryKey: ["seasons", "active"],
    queryFn: () => http.get<SeasonT>("/season/active"),
    select: (data) => data.data,
  });
}
