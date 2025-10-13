import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type PlayerT = Prisma.PlayerGetPayload<{ include: { user: true } }>;
export function usePlayers() {
  return useQuery({
    queryFn: () => http.get<PlayerT[]>("/player"),
    queryKey: ["player"],
    select: (data) => data.data,
  });
}
