import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type UsePollProps = {
  id: string;
};
export function usePoll({ id }: UsePollProps = { id: "" }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || false;
  const url = isAdmin ? `/admin/poll/${id}` : `/poll/${id}`;
  return useQuery({
    queryKey: ["poll", id],
    queryFn: () => http.get<PollT>(url),
    enabled: !!id,
    select: (data) => data.data,
  });
}
