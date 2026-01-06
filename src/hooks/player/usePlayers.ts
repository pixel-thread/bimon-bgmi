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
  displayName?: string | null;
  category: string;
  matches: number;
  deaths: number;
  kd: number;
  kills: number;
  uc: number;
  imageUrl?: string | null;
  characterImageUrl?: string | null;
};

export function usePlayers({
  page = "1",
  search = "",
  tier = "All",
  sortBy = "kd",
  sortOrder = "desc",
  enabled = true,
}: {
  page?: string | number;
  search?: string;
  tier?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
} = {}) {
  const { user } = useAuth();
  const { seasonId } = useSeasonStore();

  const queryParams = new URLSearchParams({
    page: page.toString(),
    season: seasonId,
    ...(search && { search }),
    ...(tier !== "All" && { tier }),
    sortBy,
    sortOrder,
  });

  const url =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
      ? `/admin/players?${queryParams.toString()}`
      : `/players?${queryParams.toString()}`;

  const [meta, setMeta] = useState<MetaT | undefined>(undefined);

  const query = useQuery({
    queryFn: () => http.get<PlayerT[]>(url),
    queryKey: ["player", page, seasonId, search, tier, sortBy, sortOrder],
    select: (data) => data,
    enabled: enabled && !!seasonId,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setMeta(query.data?.meta);
    }
  }, [query?.data]);

  return { ...query, data: query.data?.data, meta };
}
