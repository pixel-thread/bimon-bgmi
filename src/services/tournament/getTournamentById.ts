import { prisma } from "@/src/lib/db/prisma";
type Props = {
  id: string;
};

export async function getTournamentById({ id }: Props) {
  return prisma.tournament.findUnique({ where: { id } });
}
