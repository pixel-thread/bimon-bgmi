import { EndpointT } from "@/src/types/endpoints";

type MatchEndpointsT = "POST_ADD_NEW_MATCH" | "GET_ALL_MATCHES";

export const ADMIN_MATCH_ENDPOINTS: EndpointT<MatchEndpointsT> = {
  POST_ADD_NEW_MATCH: "/admin/match",
  GET_ALL_MATCHES: "/admin/match",
};
