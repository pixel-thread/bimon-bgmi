import { RoleRoute } from "@/src/types/routeRole";

export const routeRoles: RoleRoute[] = [
  {
    url: "/admin/*",
    role: ["SUPER_ADMIN"],
    needAuth: true,
    redirect: "/forbidden",
  },
  {
    url: "/tournament/*",
    role: ["PLAYER", "ADMIN", "SUPER_ADMIN"],
    needAuth: true,
    redirect: "/auth",
  },
  {
    url: "/settings/*",
    role: ["PLAYER", "ADMIN", "SUPER_ADMIN"],
    needAuth: true,
    redirect: "/auth",
  },
];
