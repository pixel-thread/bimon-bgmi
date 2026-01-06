import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

type Props = {
  page?: string | null;
  forcePublic?: boolean;
};

export function usePolls({ page, forcePublic }: Props = { page: "1" }) {
  // Always use public endpoint for immediate data fetch (no auth blocking)
  // Fetch with Clerk images in initial request so everything loads together
  const baseUrl = `/poll?page=${page}&withImages=true`;

  const query = useQuery({
    queryKey: ["polls"],
    queryFn: () => http.get<PollT[]>(baseUrl),
    select: (data) => data.data,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data on mount to ensure accurate vote counts for dynamic team type
  });

  return query;
}
