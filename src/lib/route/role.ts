import { RoleRoute } from "@/src/types/routeRole";

export const routeRoles: RoleRoute[] = [
  {
    url: "/admin/admins",
    role: ["SUPER_ADMIN"],
    needAuth: true,
    redirect: "/forbidden",
  },
  {
    url: "/admin/*",
    role: ["SUPER_ADMIN", "ADMIN"],
    needAuth: true,
    redirect: "/forbidden",
  },
  {
    url: "/tournament/*",
    role: ["PLAYER", "ADMIN", "SUPER_ADMIN", "USER"],
    needAuth: true,
    redirect: "/forbidden",
  },
  {
    url: "/profile",
    role: ["PLAYER", "ADMIN", "SUPER_ADMIN", "USER"],
    needAuth: true,
    redirect: "/auth",
  },
  {
    url: "/onboarding",
    role: ["PLAYER", "ADMIN", "SUPER_ADMIN", "USER"],
    needAuth: true,
    redirect: "/auth",
  },
];
