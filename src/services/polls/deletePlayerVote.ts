import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  pollId: string;
};
export async function deletePlayerVote({ playerId, pollId }: Props) {
  return prisma.playerPollVote.delete({
    where: { playerId_pollId: { playerId: playerId, pollId: pollId } },
  });
}
