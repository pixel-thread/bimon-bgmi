import { RoleRoute } from "@/src/types/routeRole";

export const routeRoles: RoleRoute[] = [
  {
    url: "/admin/*",
    role: ["SUPER_ADMIN"],
    needAuth: true,
    redirect: "/forbidden",
  },
];
