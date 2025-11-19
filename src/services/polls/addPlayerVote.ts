import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.PlayerPollVoteCreateInput;
};
export async function addPlayerVote({ data }: Props) {
  return prisma.playerPollVote.create({ data });
}
