import { prisma } from "@/src/lib/db/prisma";

type Props = {
  tournamentId: string;
};
export async function getPollByTournamentId({ tournamentId }: Props) {
  return await prisma.poll.findFirst({
    where: { tournamentId: tournamentId },
  });
}
