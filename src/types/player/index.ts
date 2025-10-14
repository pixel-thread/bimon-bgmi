import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type PlayerT = Prisma.PlayerGetPayload<{
  include: { user: true; playerStats: true; characterImage: true };
}>;

export type PlayerWithStats = PlayerT & { weightedScore: number };
