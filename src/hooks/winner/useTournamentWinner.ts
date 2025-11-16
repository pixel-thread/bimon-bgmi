import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type Props = {
  tournamentId: string;
};
export function useTournamentWinner({ tournamentId }: Props) {
  return useQuery({
    queryKey: ["tournament-winner", tournamentId],
    select: (data) => data.data,
    enabled: !!tournamentId,
    queryFn: () =>
      http.get(
        ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_WINNER.replace(
          ":id",
          tournamentId,
        ),
      ),
  });
}
