import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type Props = {
  page?: string | null;
};
export function usePolls({ page }: Props = { page: "1" }) {
  const { user } = useAuth();
  const isAdmin =
    user?.role === "SUPER_ADMIN" ? true : user?.role === "ADMIN" ? true : false;
  const url = isAdmin ? `/admin/poll?page=${page}` : `/poll?page=${page}`;

  return useQuery({
    queryKey: ["polls"],
    queryFn: () => http.get<PollT[]>(url),
    select: (data) => data.data,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
