import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { PlayerT } from "@/src/types/player";

export function usePlayers() {
  const { user } = useAuth();
  const url = user?.role === "SUPER_ADMIN" ? `/admin/players` : `/players`;
  return useQuery({
    queryFn: () => http.get<PlayerT[]>(url),
    queryKey: ["player"],
    select: (data) => data.data,
  });
}
