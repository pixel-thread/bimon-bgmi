import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export interface AuthContextI {
  user: Prisma.UserGetPayload<{
    include: { player: { include: { characterImage: true } } };
  }> | null;
  isAuthLoading: boolean;
  isSignedIn: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}
