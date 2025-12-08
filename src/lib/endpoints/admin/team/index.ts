import { EndpointT } from "@/src/types/endpoints";

type TeamEndpointsT =
  | "POST_CREATE_TEAM_BY_POLL"
  | "POST_PREVIEW_TEAM_BY_POLL"
  | "POST_CREATE_TEAM_BY_TOURNAMENT_ID"
  | "GET_TEAM_BY_ID"
  | "DELETE_TEAM_BY_ID"
  | "POST_ADD_PLAYER_TO_TEAM"
  | "POST_REMOVE_PLAYER_FROM_TEAM"
  | "POST_DELETE_TEAMS_BY_TOURNAMENT_ID"
  | "POST_ADD_TEAM_STATS"
  | "PUT_UPDATE_TEAM_STATS"
  | "GET_TEAM_STATS"
  | "POST_SWAP_PLAYERS";

export const ADMIN_TEAM_ENDPOINTS: EndpointT<TeamEndpointsT> = {
  POST_CREATE_TEAM_BY_POLL: "/admin/team/create-poll-teams?size=:size",
  POST_PREVIEW_TEAM_BY_POLL: "/admin/team/preview-poll-teams?size=:size",
  POST_CREATE_TEAM_BY_TOURNAMENT_ID: "/admin/team",
  POST_ADD_PLAYER_TO_TEAM: "/admin/team/:teamId/add-player",
  POST_REMOVE_PLAYER_FROM_TEAM: "/admin/team/:teamId/remove-player",
  GET_TEAM_BY_ID: "/admin/team/:teamId",
  POST_DELETE_TEAMS_BY_TOURNAMENT_ID: "/admin/team/delete-teams",
  DELETE_TEAM_BY_ID: "/admin/team/:teamId",
  POST_ADD_TEAM_STATS: "/admin/team/:teamId/stats",
  PUT_UPDATE_TEAM_STATS: "/admin/team/:teamId/stats",
  GET_TEAM_STATS: "/admin/team/:teamId/stats",
  POST_SWAP_PLAYERS: "/admin/team/swap-players",
};
