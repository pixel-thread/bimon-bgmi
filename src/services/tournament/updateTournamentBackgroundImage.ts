import { prisma } from "@/src/lib/db/prisma";

type Props = {
  galleryId: string;
  tournamentId: string;
};

export async function removeTournamentBackgroundImage({
  tournamentId,
  galleryId,
}: Props) {
  return prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      gallery: {
        disconnect: { id: galleryId },
      },
    },
  });
}
