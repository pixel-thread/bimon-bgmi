import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.TournamentCreateInput;
};
export async function createTournament({ data }: Props) {
  return prisma.tournament.create({ data });
}
