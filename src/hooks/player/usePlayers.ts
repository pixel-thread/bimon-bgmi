import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { PlayerT } from "@/src/types/player";
import { MetaT } from "@/src/types/meta";
import { useEffect, useState } from "react";
import { useSeasonStore } from "@/src/store/season";

type UsePlayersProps = {
  page?: string | number;
};

export function usePlayers({ page }: UsePlayersProps = { page: "1" }) {
  const { user } = useAuth();
  const { seasonId } = useSeasonStore();
  const url =
    user?.role === "SUPER_ADMIN"
      ? `/admin/players?page=${page}&season=${seasonId}`
      : `/players?page=${page}&season=${seasonId}`;

  const [meta, setMeta] = useState<MetaT | null>(null);

  const query = useQuery({
    queryFn: () => http.get<PlayerT[]>(url),
    queryKey: ["player", page, seasonId],
    select: (data) => data,
    refetchOnWindowFocus: false,
    enabled: !!seasonId,
  });

  useEffect(() => {
    if (query.data) {
      setMeta(query.data.meta);
    }
  }, [query?.data]);

  return { ...query, data: query.data?.data, meta };
}
