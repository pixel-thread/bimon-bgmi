import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { SEASON_ENDPOINTS } from "@/src/lib/endpoints/season";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/auth/useAuth";

type SeasonT = Prisma.SeasonGetPayload<{ include: { player: true } }>;

export function useGetSeasons() {
  const { isSignedIn, isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["seasons"],
    queryFn: () => http.get<SeasonT[]>(SEASON_ENDPOINTS.GET_SEASONS),
    select: (data) => data.data,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    enabled: isSignedIn && !isAuthLoading, // Wait for auth before fetching
  });
}
