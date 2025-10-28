import { EndpointT } from "@/src/types/endpoints";

type TournamentEndpointsT =
  | "POST_CREATE_TOURNAMENT"
  | "GET_TOURNAMENT_MATCHES"
  | "GET_TEAM_BY_TOURNAMENT_ID"
  | "GET_TOURNAMNTS_BY_SEASON_ID"
  | "GET_ALL_TOURNAMENTS";

export const ADMIN_TOURNAMENT_ENDPOINTS: EndpointT<TournamentEndpointsT> = {
  POST_CREATE_TOURNAMENT: "/admin/tournament",
  GET_TOURNAMENT_MATCHES: "/admin/tournament/:id/match",
  GET_TEAM_BY_TOURNAMENT_ID: "/admin/tournament/:id/team",
  GET_TOURNAMNTS_BY_SEASON_ID: "/admin/tournament/season/:id",
  GET_ALL_TOURNAMENTS: "/admin/tournament",
};
