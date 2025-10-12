import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type TournamentT = Prisma.TournamentGetPayload<{}>;

type Props = {
  id?: string;
};

export function useTournament({ id }: Props) {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: () => http.get<TournamentT>("/tournament/" + id),
    enabled: !!id,
    select: (data) => data.data,
  });
}
