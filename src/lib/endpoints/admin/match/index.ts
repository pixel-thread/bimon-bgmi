import { EndpointT } from "@/src/types/endpoints";

type MatchEndpointsT =
  | "POST_ADD_NEW_MATCH"
  | "GET_ALL_MATCHES"
  | "DELETE_MATCH_BY_ID"
  | "PUT_BULK_UPDATE_MATCH_STATS";

export const ADMIN_MATCH_ENDPOINTS: EndpointT<MatchEndpointsT> = {
  POST_ADD_NEW_MATCH: "/admin/match",
  GET_ALL_MATCHES: "/admin/match",
  DELETE_MATCH_BY_ID: "/admin/match/:id",
  PUT_BULK_UPDATE_MATCH_STATS: "/admin/match/:id/bulk-stats",
};

