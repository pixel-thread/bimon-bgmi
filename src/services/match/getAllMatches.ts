import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where?: Prisma.MatchWhereInput;
  include?: Prisma.MatchInclude;
};
export async function getAllMatches(
  { where, include }: Props = { where: undefined, include: undefined },
) {
  return await prisma.match.findMany({
    where,
    include,
  });
}
