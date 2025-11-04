import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import http from "@/src/utils/http";
import { TEAM_ENDPOINTS } from "@/src/lib/endpoints/team";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";

type Props = { teamId: string };

export function useTeamStats({ teamId }: Props) {
  const { isSuperAdmin } = useAuth();
  const url = isSuperAdmin
    ? ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId)
    : TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId);

  return useQuery({
    queryKey: ["teamStats", teamId],
    queryFn: async () => http.get(url),
    select: (data) => data.data,
  });
}
