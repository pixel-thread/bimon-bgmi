import { prisma } from "@/src/lib/db/prisma";

type Props = {
  playerId: string;
  pollId: string;
};
export async function getPlayerVoteByPollId({ playerId, pollId }: Props) {
  return await prisma.playerPollVote.findFirst({
    where: { playerId: playerId, pollId: pollId },
  });
}
