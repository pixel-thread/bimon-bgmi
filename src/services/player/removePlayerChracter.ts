import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
  galleryId?: string;
};
export async function removePlayerChracterImage({ id, galleryId }: Props) {
  if (!galleryId) {
    throw new Error("Missing galleryId");
  }
  return await prisma.player.update({
    where: { id },
    data: {
      characterImage: { disconnect: { id: galleryId } },
    },
  });
}
