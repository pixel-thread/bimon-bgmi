import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  seasonId?: string;
};

export async function getPlayerStatsByPlayerId({ playerId, seasonId }: Props) {
  return await prisma.playerStats.findUnique({
    where: { seasonId_playerId: { playerId, seasonId: seasonId || "" } },
    include: { matches: true },
  });
}
