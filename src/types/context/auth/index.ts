import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type UserT = Prisma.UserGetPayload<{
  include: {
    player: { include: { characterImage: true; playerBanned: true } };
  };
}> | null;

export interface AuthContextI {
  user: UserT | null | undefined;
  isAuthLoading: boolean;
  isSignedIn: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}
