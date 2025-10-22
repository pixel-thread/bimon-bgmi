import { prisma } from "@/src/lib/db/prisma";

type Props = {
  teamId: string;
  playerId: string;
};
export async function addPlayerToTeam({ teamId, playerId }: Props) {
  return await prisma.team.update({
    where: { id: teamId },
    data: { players: { connect: { id: playerId } } },
  });
}
