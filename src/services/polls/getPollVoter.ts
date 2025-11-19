import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where?: Prisma.PlayerPollVoteWhereInput;
  include?: Prisma.PlayerPollVoteInclude;
};
export async function getPollVoter({ where, include }: Props) {
  return await prisma.playerPollVote.findMany({ where, include });
}
