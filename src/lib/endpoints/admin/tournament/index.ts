import { EndpointT } from "@/src/types/endpoints";

type TournamentEndpointsT =
  | "POST_CREATE_TOURNAMENT"
  | "GET_TOURNAMENT_MATCHES"
  | "GET_TEAM_BY_TOURNAMENT_ID"
  | "GET_TOURNAMNTS_BY_SEASON_ID"
  | "GET_ALL_TOURNAMENTS"
  | "GET_TEAMS_STATS"
  | "GET_TOURNAMENT_WINNER"
  | "POST_DECLEAR_TOURNAMENT_WINNER";

export const ADMIN_TOURNAMENT_ENDPOINTS: EndpointT<TournamentEndpointsT> = {
  POST_CREATE_TOURNAMENT: "/admin/tournament",
  GET_TOURNAMENT_MATCHES: "/admin/tournament/:id/match",
  GET_TEAM_BY_TOURNAMENT_ID:
    "/admin/tournament/:id/team?match=:matchId&page=:page",
  GET_TOURNAMNTS_BY_SEASON_ID: "/admin/tournament/season/:id",
  GET_ALL_TOURNAMENTS: "/admin/tournament",
  GET_TEAMS_STATS: "/admin/tournament/:id/teams-stats?match=:matchId",
  GET_TOURNAMENT_WINNER: "/admin/tournament/:id/winner",
  POST_DECLEAR_TOURNAMENT_WINNER: "/admin/tournament/:id/winner",
};
