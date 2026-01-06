import { PollT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type UsePollProps = {
  id: string;
};
export function usePoll({ id }: UsePollProps = { id: "" }) {
  // Always use public endpoint for immediate data fetch (no auth blocking)
  const url = `/poll/${id}`;
  return useQuery({
    queryKey: ["poll", id],
    queryFn: () => http.get<PollT>(url),
    enabled: !!id,
    select: (data) => data.data,
    refetchOnWindowFocus: false,
  });
}
