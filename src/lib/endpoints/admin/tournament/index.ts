import { EndpointT } from "@/src/types/endpoints";

type TournamentEndpointsT = "POST_CREATE_TOURNAMENT";

export const ADMIN_TOURNAMENT_ENDPOINTS: EndpointT<TournamentEndpointsT> = {
  POST_CREATE_TOURNAMENT: "/admin/tournament",
};
