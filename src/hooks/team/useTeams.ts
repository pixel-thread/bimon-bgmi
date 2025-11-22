import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";

type Props = {
  page?: string;
};

export function useTeams({ page = "1" }: Props = { page: "1" }) {
  const { isSuperAdmin } = useAuth();
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const urlBase = isSuperAdmin
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID.replace(
        ":matchId",
        matchId,
      ).replace(":page", page)
    : TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID;

  const url = urlBase.replace(":id", tournamentId).replace(":matchId", matchId);

  const query = useQuery({
    queryFn: () => http.get<TeamT[]>(url),
    queryKey: ["teams", tournamentId, matchId, page],
    enabled: !!tournamentId && !!matchId,
    select: (data) => data,
    placeholderData: keepPreviousData,
  });
  const meta = query?.data?.meta;

  return { ...query, data: query.data?.data, meta };
}
