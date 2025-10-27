import { EndpointT } from "@/src/types/endpoints";

type SeasonEndpointsT = "GET_ACTIVE_SEASON" | "GET_SEASONS";

export const SEASON_ENDPOINTS: EndpointT<SeasonEndpointsT> = {
  GET_ACTIVE_SEASON: "/season/active",
  GET_SEASONS: "/season",
};
