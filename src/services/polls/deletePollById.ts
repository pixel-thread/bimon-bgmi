import { prisma } from "@/src/lib/db/prisma";

type Props = { id: string };

export async function deletePollById({ id }: Props) {
  return await prisma.$transaction(async (tx) => {
    await tx.playerPollVote.deleteMany({
      where: { pollId: id },
    });
    await tx.pollOption.deleteMany({
      where: { pollVoteId: id },
    });
    await tx.poll.delete({
      where: { id: id },
    });
  });
}
