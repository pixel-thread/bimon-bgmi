import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type SeasonT = Prisma.SeasonGetPayload<{}>;
export function useGetSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: () => http.get<SeasonT[]>("/season"),
    select: (data) => data.data,
  });
}
