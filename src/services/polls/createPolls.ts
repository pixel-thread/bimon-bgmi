import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.PollCreateInput;
};

export async function createPolls({ data }: Props) {
  return prisma.poll.create({ data });
}
