import http from "@/src/utils/http";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { MetaT } from "@/src/types/meta";
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
  profileImageUrl?: string | null;
  characterImageUrl?: string | null;
  hasRoyalPass?: boolean;
  isAnimated?: boolean;
  isVideo?: boolean;
  thumbnailUrl?: string | null;
};

type PlayersResponse = {
  data: PlayerT[];
  meta: MetaT;
};

export function usePlayers({
  search = "",
  tier = "All",
  sortBy = "kd",
  sortOrder = "desc",
  enabled = true,
}: {
  search?: string;
  tier?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
} = {}) {
  const { seasonId } = useSeasonStore();

  const query = useInfiniteQuery({
    queryKey: ["player", "infinite", seasonId, search, tier, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams({
        page: pageParam.toString(),
        season: seasonId,
        ...(search && { search }),
        ...(tier !== "All" && { tier }),
        sortBy,
        sortOrder,
      });

      const url = `/players?${queryParams.toString()}`;
      const response = await http.get<PlayerT[]>(url);
      return response as unknown as PlayersResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.meta?.hasNextPage) {
        return (lastPage.meta.page || 1) + 1;
      }
      return undefined;
    },
    enabled: enabled && !!seasonId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into a single array of players
  const allPlayers = query.data?.pages?.flatMap((page) => page.data) ?? [];

  // Get meta from first page for total count, etc.
  const meta = query.data?.pages?.[0]?.meta;

  return {
    ...query,
    data: allPlayers,
    meta,
  };
}
