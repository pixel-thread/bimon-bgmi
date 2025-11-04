import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type PlayerT = Prisma.PlayerGetPayload<{
  include: { user: true };
}>;
export type PlayerWithStatsT = Prisma.PlayerGetPayload<{
  include: { user: true; playerStats: true };
}>;

export type PlayerWithWeightT = Prisma.PlayerGetPayload<{
  include: { user: true; playerStats: true };
}> & { weightedScore: number };

export type PlayerStatsT = Prisma.PlayerStatsGetPayload<{
  include: { matches: true };
}>;
