import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type Props = {
  page?: string | null;
  forcePublic?: boolean;
};

export function usePolls({ page, forcePublic }: Props = { page: "1" }) {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "SUPER_ADMIN" ? true : user?.role === "ADMIN" ? true : false;

  // Fetch with Clerk images in initial request so everything loads together
  const baseUrl = isAdmin && !forcePublic
    ? `/admin/poll?page=${page}`
    : `/poll?page=${page}&withImages=true`;

  const query = useQuery({
    queryKey: ["polls"],
    queryFn: () => http.get<PollT[]>(baseUrl),
    select: (data) => data.data,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return query;
}
