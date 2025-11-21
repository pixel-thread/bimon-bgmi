import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { MetaT } from "@/src/types/meta";
import { useEffect, useState } from "react";
import { useSeasonStore } from "@/src/store/season";

type UsePlayersProps = {
  page?: string | number;
};

type PlayerT = {
  id: string;
  isBanned: boolean;
  userName: string;
  category: string;
  matches: number;
  kd: number;
};

export function usePlayers({ page }: UsePlayersProps = { page: "1" }) {
  const { user } = useAuth();
  const { seasonId } = useSeasonStore();
  const url =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
      ? `/admin/players?page=${page}&season=${seasonId}`
      : `/players?page=${page}&season=${seasonId}`;

  const [meta, setMeta] = useState<MetaT | undefined>(undefined);

  const query = useQuery({
    queryFn: () => http.get<PlayerT[]>(url),
    queryKey: ["player", page, seasonId],
    select: (data) => data,
    enabled: !!seasonId,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data) {
      setMeta(query.data?.meta);
    }
  }, [query?.data]);

  return { ...query, data: query.data?.data, meta };
}
