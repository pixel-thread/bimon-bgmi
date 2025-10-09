import { RoleRoute } from "@/src/types/routeRole";

export const routeRoles: RoleRoute[] = [
  {
    url: "/admin/*",
    role: ["PLAYER"],
    needAuth: true,
    redirect: "/forbidden",
  },
];
