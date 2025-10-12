import { prisma } from "@/src/lib/db/prisma";

export async function getTournamentBySeasonId({
  seasonId,
}: {
  seasonId: string;
}) {
  return await prisma.tournament.findMany({
    where: { seasonId: seasonId },
  });
}
