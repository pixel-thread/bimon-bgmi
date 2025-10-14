import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  include?: Prisma.PollInclude;
  where?: Prisma.PollWhereInput;
};
export async function getPolls({ include, where }: Props = {}) {
  return prisma.poll.findMany({
    where,
    include,
  });
}
