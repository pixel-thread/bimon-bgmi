import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useEffect, useRef } from "react";

type Props = {
  page?: string | null;
  forcePublic?: boolean;
};

export function usePolls({ page, forcePublic }: Props = { page: "1" }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const imagesFetched = useRef(false);

  const isAdmin =
    user?.role === "SUPER_ADMIN" ? true : user?.role === "ADMIN" ? true : false;

  const baseUrl = isAdmin && !forcePublic
    ? `/admin/poll?page=${page}`
    : `/poll?page=${page}`;

  const query = useQuery({
    queryKey: ["polls"],
    queryFn: () => http.get<PollT[]>(baseUrl),
    select: (data) => data.data,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // After initial load, fetch images in background and merge into cache
  useEffect(() => {
    if (query.isSuccess && !imagesFetched.current && !isAdmin) {
      imagesFetched.current = true;

      // Fetch with images in background after short delay
      const timer = setTimeout(async () => {
        try {
          const response = await http.get<PollT[]>(`${baseUrl}&withImages=true`);
          if (response.data) {
            // Update cache directly without triggering a refetch
            queryClient.setQueryData(["polls"], (oldData: any) => {
              if (!oldData) return response;
              return { ...oldData, data: response.data };
            });
          }
        } catch (error) {
          console.error("Failed to fetch poll images:", error);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [query.isSuccess, isAdmin, baseUrl, queryClient]);

  return query;
}
