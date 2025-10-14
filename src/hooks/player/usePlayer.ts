import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type PlayerT = Prisma.PlayerGetPayload<{
  include: { user: true; playerStats: true };
}>;

type UsePlayerT = {
  id: string;
};

export function usePlayer({ id }: UsePlayerT) {
  const url = `/players/${id}`;

  return useQuery({
    queryFn: () => http.get<PlayerT>(url),
    queryKey: ["player", id],
    select: (data) => data.data,
    enabled: !!id,
  });
}
