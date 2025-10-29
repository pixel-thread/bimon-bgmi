import { EndpointT } from "@/src/types/endpoints";

type PlayerEndpointsT =
  | "POST_UPLOAD_CHARACTER_IMAGE"
  | "DELETE_UPLOAD_CHARACTER_IMAGE"
  | "GET_TOP_PLAYER"
  | "GET_PLAYER_BY_ID"
  | "GET_ALL_PLAYERS";

export const PLAYER_ENDPOINTS: EndpointT<PlayerEndpointsT> = {
  POST_UPLOAD_CHARACTER_IMAGE: "/players/:id/character",
  DELETE_UPLOAD_CHARACTER_IMAGE: "/players/:id/character",
  GET_TOP_PLAYER: "/players/top-player",
  GET_ALL_PLAYERS: "/players",
  GET_PLAYER_BY_ID: "/players/:id",
};
