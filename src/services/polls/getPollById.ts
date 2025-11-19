import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PollWhereUniqueInput;
  include?: Prisma.PollInclude;
};
export async function getPollById({ where, include }: Props) {
  return await prisma.poll.findUnique({
    where,
    include,
  });
}
