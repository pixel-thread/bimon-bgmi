import { EndpointT } from "@/src/types/endpoints";

type UserEndpointsT = "GET_ALL_USER" | "PUT_USER_ROLE";

export const ADMIN_USER_ENDPOINTS: EndpointT<UserEndpointsT> = {
  GET_ALL_USER: `/admin/users?page=:page`,
  PUT_USER_ROLE: "/admin/users/:id/role",
};
