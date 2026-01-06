import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type UserT = Prisma.UserGetPayload<{
  include: {
    player: {
      include: {
        characterImage: true;
        playerBanned: true;
        uc: true;
        playerStats: {
          select: {
            kills: true;
            deaths: true;
            seasonId: true;
          };
        };
      };
    };
  };
}> | null;

export interface AuthContextI {
  user: UserT | null | undefined;
  isAuthLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}
