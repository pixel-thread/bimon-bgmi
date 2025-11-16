import { WINNER_ENDPOINTS } from "@/src/lib/endpoints/winner";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type Props = {
  seasonId: string;
};
export function useTournamentWinner({ seasonId: seasonId }: Props) {
  return useQuery({
    queryKey: ["tournament-winner", seasonId],
    select: (data) => data.data,
    enabled: !!seasonId,
    queryFn: () =>
      http.post(WINNER_ENDPOINTS.POST_GET_TOURNAMENT_WINNER_BY_SEASON, {
        seasonId: seasonId,
      }),
  });
}
