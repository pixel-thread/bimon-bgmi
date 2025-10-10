import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.SeasonCreateInput;
};
export async function createSeason({ data }: Props) {
  const activeSeasion = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
  });
  if (activeSeasion) {
    await prisma.season.update({
      where: { id: activeSeasion.id },
      data: { status: "INACTIVE" },
    });
  }

  return await prisma.season.create({ data });
}
