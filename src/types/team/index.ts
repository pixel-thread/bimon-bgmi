import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type TeamT = Prisma.TeamGetPayload<{
  include: {
    players: { include: { user: true } };
    teamStats: true;
  };
}>;
export type TeamStatsT = Prisma.TeamStatsGetPayload<{
  include: {
    playersStats: true;
  };
}>;
