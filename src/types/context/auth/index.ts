import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type UserT = Prisma.UserGetPayload<{
  include: { player: { include: { characterImage: true } } };
}> | null;

export interface AuthContextI {
  user: UserT;
  isAuthLoading: boolean;
  isSignedIn: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}
