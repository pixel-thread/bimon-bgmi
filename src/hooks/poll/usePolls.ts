import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../useAuth";

export function usePolls() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "PLAYER" || false;
  const url = isAdmin ? `/admin/poll` : `/poll`;
  return useQuery({
    queryKey: ["polls"],
    queryFn: () => http.get<PollT[]>(url),
    select: (data) => data.data,
  });
}
