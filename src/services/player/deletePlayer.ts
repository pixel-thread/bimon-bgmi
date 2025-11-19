import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PlayerWhereUniqueInput;
};

export async function deletePlayer({ where }: Props) {
  return await prisma.player.delete({ where });
}
