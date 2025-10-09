export type Role = "SUPER_ADMIN" | "ADMIN" | "PLAYER";

export type RoleRoute = {
  url: string;
  role: Role[];
  redirect?: string;
  needAuth?: boolean;
};
