import { EndpointT } from "@/src/types/endpoints";

type TeamEndpointsT = "GET_TEAM_BY_ID" | "GET_TEAM_STATS";

export const TEAM_ENDPOINTS: EndpointT<TeamEndpointsT> = {
  GET_TEAM_BY_ID: "/team/:teamId",
  GET_TEAM_STATS: "/team/:teamId/stats",
};
