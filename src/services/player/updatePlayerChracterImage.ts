import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
  galleryId: string;
};
export async function updatePlayerChracterImage({ id, galleryId }: Props) {
  return await prisma.player.update({
    where: { id },
    data: {
      characterImage: { connect: { id: galleryId } },
    },
  });
}
