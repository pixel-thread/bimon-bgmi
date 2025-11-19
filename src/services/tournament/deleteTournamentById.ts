import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};
export async function deleteTournamentById({ id }: Props) {
  return prisma.tournament.delete({
    where: { id },
  });
}
