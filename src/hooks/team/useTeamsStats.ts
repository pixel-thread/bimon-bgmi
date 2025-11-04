import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import http from "@/src/utils/http";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useMatchStore } from "@/src/store/match/useMatchStore";

type TeamStatsT = Prisma.TeamStatsGetPayload<{ include: { team: true } }>;

export function useTeamsStats() {
  const { isSuperAdmin } = useAuth();
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();

  const url = isSuperAdmin
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAMS_STATS.replace(
        ":id",
        tournamentId
      ).replace(":matchId", matchId)
    : TOURNAMENT_ENDPOINTS.GET_TEAMS_STATS.replace(":id", tournamentId).replace(
        ":matchId",
        matchId
      );

  return useQuery({
    queryKey: ["teamsStats", tournamentId, matchId],
    queryFn: async () => http.get<TeamStatsT[]>(url),
    select: (data) => data.data,
  });
}
