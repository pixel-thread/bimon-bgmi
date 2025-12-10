import { EndpointT } from "@/src/types/endpoints";

type PlayerEndpointsT = "POST_TOGGLE_BANNED" | "DELETE_PLAYER_BY_ID" | "POST_UPDATE_BALANCE" | "PATCH_PLAYER";

export const ADMIN_PLAYER_ENDPOINTS: EndpointT<PlayerEndpointsT> = {
  POST_TOGGLE_BANNED: "/admin/players/:id/toggle-banned",
  DELETE_PLAYER_BY_ID: "/admin/players/:id",
  POST_UPDATE_BALANCE: "/admin/players/:id/uc",
  PATCH_PLAYER: "/admin/players/:id",
};
