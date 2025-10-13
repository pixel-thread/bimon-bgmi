import { prisma } from "@/src/lib/db/prisma";

type Props = {
  galleryId: string;
  tournamentId: string;
};

export async function addTournamentBackgroundImage({
  tournamentId,
  galleryId,
}: Props) {
  return prisma.tournament.update({
    where: { id: tournamentId },
    data: { gallery: { connect: { id: galleryId } } },
    include: { gallery: true },
  });
}
