import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useSeasonStore } from "@/src/store/season";
import { useTournamentStore } from "@/src/store/tournament";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TournamentT = Prisma.TournamentGetPayload<{ include: { gallery: true } }>;

type Props = {
  id?: string;
};

export function useTournament({ id }: Props = { id: "" }) {
  const { tournamentId } = useTournamentStore();
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () =>
      http.get<TournamentT[]>(`/tournament/season/${tournamentId}`),
    enabled: !!id,
    select: (data) => data.data,
  });
}
