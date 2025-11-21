import { $Enums } from "../lib/db/prisma/generated/prisma";

export type RoleRoute = {
  url: string;
  role: $Enums.Role[];
  redirect?: string;
  needAuth?: boolean;
};
