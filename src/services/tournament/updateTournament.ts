import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.TournamentCreateInput;
};
export async function updateTournament({ data }: Props) {
  return prisma.tournament.update({
    where: { id: data.id },
    data: {
      ...data,
      startDate: new Date(data.startDate),
    },
  });
}
