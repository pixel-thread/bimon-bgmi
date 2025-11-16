import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.SeasonWhereUniqueInput;
};
export async function getUniqueSeason({ where }: Props) {
  return await prisma.season.findUnique({ where });
}
