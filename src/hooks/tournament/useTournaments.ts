import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { TournamentT } from "@/src/types/tournament";

type Props = {
  seasonId?: string;
};
export function useTournaments({ seasonId: id }: Props = {}) {
  if (id !== "all") {
    return useQuery({
      queryKey: ["tournaments", id],
      queryFn: () => http.get<TournamentT[]>(`/tournament/season/${id}`),
      select: (data) => data.data,
      enabled: !!id,
    });
  }
  return useQuery({
    queryKey: ["tournaments", "all"],
    queryFn: () => http.get<TournamentT[]>("/tournament"),
    select: (data) => data.data,
  });
}
