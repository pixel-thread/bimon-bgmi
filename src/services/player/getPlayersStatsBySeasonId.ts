import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  seasonId: string;
  include?: Prisma.PlayerStatsInclude;
};

export async function getPlayersStatsBySeasonId({ seasonId, include }: Props) {
  return await prisma.playerStats.findMany({
    where: { seasonId },
    include,
  });
}
