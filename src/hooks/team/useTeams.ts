import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useTournamentStore } from "@/src/store/tournament";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TeamT = Prisma.TeamGetPayload<{
  include: { players: { include: { user: true; playerStats: true } } };
}>;

export function useTeams() {
  const { tournamentId } = useTournamentStore();

  return useQuery({
    queryFn: () => http.get<TeamT[]>(`/tournament/${tournamentId}/team`),
    queryKey: ["team", tournamentId],
    select: (data) => data.data,
    enabled: !!tournamentId,
  });
}
