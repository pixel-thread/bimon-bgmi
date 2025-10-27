import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = { where: Prisma.MatchWhereUniqueInput };

export async function getMatchById({ where }: Props) {
  return await prisma.match.findUnique({ where });
}
