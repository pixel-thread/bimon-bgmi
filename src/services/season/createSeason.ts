import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getActiveSeason } from "./getActiveSeason";

type Props = {
  data: Prisma.SeasonCreateInput;
};
export async function createSeason({ data }: Props) {
  const activeSeasion = await getActiveSeason();

  if (activeSeasion) {
    await prisma.season.update({
      where: { id: activeSeasion.id },
      data: { status: "INACTIVE" },
    });
  }

  return await prisma.season.create({
    data: {
      startDate: new Date(data.startDate),
      description: data.description,
      name: data.name,
      createdBy: data.createdBy,
    },
  });
}
