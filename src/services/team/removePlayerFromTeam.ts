import { prisma } from "@/src/lib/db/prisma";

type Props = {
  teamId: string;
  playerId: string;
};

export async function removePlayerFromTeam({ teamId, playerId }: Props) {
  return await prisma.$transaction(async (tx) => {
    await tx.teamPlayerStats.deleteMany({
      where: { playerId, teamId },
    });

    await tx.matchPlayerPlayed.deleteMany({
      where: { playerId: playerId, teamId: teamId },
    });

    return await tx.team.update({
      where: { id: teamId },
      data: { players: { disconnect: { id: playerId } } },
    });
  });
}
