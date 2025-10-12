import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TournamentsT = Prisma.TournamentGetPayload<{}>;

type Props = {
  seasonId?: string;
};
export function useTournaments({ seasonId: id }: Props = {}) {
  if (id !== "all") {
    return useQuery({
      queryKey: ["tournaments", id],
      queryFn: () => http.get<TournamentsT[]>(`/tournament/season/${id}`),
      select: (data) => data.data,
    });
  }
  return useQuery({
    queryKey: ["tournaments", "all"],
    queryFn: () => http.get<TournamentsT[]>("/tournament"),
    select: (data) => data.data,
  });
}
