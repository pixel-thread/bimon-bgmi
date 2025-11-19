import { EndpointT } from "@/src/types/endpoints";

type PlayerEndpointsT = "POST_TOGGLE_BANNED" | "DELETE_PLAYER_BY_ID";

export const ADMIN_PLAYER_ENDPOINTS: EndpointT<PlayerEndpointsT> = {
  POST_TOGGLE_BANNED: "/admin/players/:id/toggle-banned",
  DELETE_PLAYER_BY_ID: "/admin/players/:id",
};
