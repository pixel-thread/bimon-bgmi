import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import { useTournamentStore } from "@/src/store/tournament";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TournamentT = Prisma.TournamentGetPayload<{ include: { gallery: true } }>;

type Props = {
  id?: string;
};

export function useTournament({ id }: Props = { id: "" }) {
  const { tournamentId } = useTournamentStore();
  const url = TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID.replace(
    ":id",
    tournamentId,
  );
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => http.get<TournamentT>(url),
    enabled: !!id,
    select: (data) => data.data,
  });
}
