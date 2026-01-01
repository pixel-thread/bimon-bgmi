import { useTeamsData } from "./useTeamsData";

type Props = {
  page?: string;
  refetchOnWindowFocus?: boolean;
};

/**
 * Hook for team data - derived from useTeamsData
 * 
 * This is a thin wrapper over the base hook for backward compatibility.
 * It shares the same React Query cache with other derived hooks.
 */
export function useTeams({ page = "1", refetchOnWindowFocus = true }: Props = { page: "1" }) {
  return useTeamsData({ page, refetchOnWindowFocus });
}
