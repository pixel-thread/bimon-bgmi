import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  include?: Prisma.PollInclude;
  where?: Prisma.PollWhereInput;
  page?: string | null;
  take?: number;
  orderBy?: Prisma.PollOrderByWithRelationInput;
};

export async function getPolls({ include, where, page, orderBy }: Props = {}) {
  return prisma.poll.findMany({
    where,
    include,
    orderBy,
  });
}
