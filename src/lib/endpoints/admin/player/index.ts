import { EndpointT } from "@/src/types/endpoints";

type PlayerEndpointsT = "POST_TOGGLE_BANNED";

export const ADMIN_PLAYER_ENDPOINTS: EndpointT<PlayerEndpointsT> = {
  POST_TOGGLE_BANNED: "/admin/players/:id/toggle-banned",
};
