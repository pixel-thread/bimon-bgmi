import { PlayerPollVoteT } from "@/src/types/poll";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type Props = {
  pollId: string;
  enabled?: boolean;
};
export function usePlayerVote({ pollId, enabled = true }: Props) {
  return useQuery({
    queryKey: ["player-vote", pollId],
    queryFn: () => http.get<PlayerPollVoteT[]>(`/poll/${pollId}/vote`),
    enabled: !!pollId && enabled,
    select: (data) => data.data,
  });
}
