import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.UCWhereUniqueInput;
};

export async function getUniqueUc({ where }: Props) {
  return await prisma.uC.findUnique({
    where,
  });
}
