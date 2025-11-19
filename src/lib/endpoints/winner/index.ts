import { EndpointT } from "@/src/types/endpoints";

type WinnerEnpoints = "POST_GET_TOURNAMENT_WINNER_BY_SEASON";

export const WINNER_ENDPOINTS: EndpointT<WinnerEnpoints> = {
  POST_GET_TOURNAMENT_WINNER_BY_SEASON: "/winner/season",
};
