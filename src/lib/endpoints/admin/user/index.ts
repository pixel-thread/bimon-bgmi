import { EndpointT } from "@/src/types/endpoints";

type UserEndpointsT = "GET_ALL_USER";

export const USER_ENDPOINTS: EndpointT<UserEndpointsT> = {
  GET_ALL_USER: "/admin/users",
};
