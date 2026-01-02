import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/tournament";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TournamentT = Prisma.TournamentGetPayload<{ include: { gallery: true } }>;

type Props = {
  id: string;
  enabled?: boolean;
};

export function useTournament({ id, enabled = true }: Props = { id: "", enabled: true }) {
  const url = TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_BY_ID.replace(":id", id);
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: () => http.get<TournamentT>(url),
    enabled: enabled && !!id,
    select: (data) => data.data,
  });
}
