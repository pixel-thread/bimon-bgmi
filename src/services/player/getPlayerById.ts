import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  id: string;
  include?: Prisma.PlayerInclude;
};
export async function getPlayerById({ id, include }: Props) {
  return await prisma.player.findUnique({
    where: { id },
    include,
  });
}
