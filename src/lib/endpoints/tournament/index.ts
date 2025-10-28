import { EndpointT } from "@/src/types/endpoints";

type TournamentEndpointsT =
  | "POST_CREATE_TOURNAMENT"
  | "GET_TOURNAMENT_MATCHES"
  | "GET_TEAM_BY_TOURNAMENT_ID"
  | "GET_TOURNAMNTS_BY_SEASON_ID"
  | "GET_ALL_TOURNAMENTS";

export const TOURNAMENT_ENDPOINTS: EndpointT<TournamentEndpointsT> = {
  POST_CREATE_TOURNAMENT: "/tournament",
  GET_TOURNAMENT_MATCHES: "/tournament/:id/match",
  GET_TEAM_BY_TOURNAMENT_ID: "/tournament/:id/team",
  GET_TOURNAMNTS_BY_SEASON_ID: "/tournament/season/:id",
  GET_ALL_TOURNAMENTS: "/tournament",
};
