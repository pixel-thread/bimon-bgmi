import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
  isCharacterImg?: boolean;
};

export async function getGalleryImageById({ id, isCharacterImg }: Props) {
  return prisma.gallery.findUnique({
    where: { id, isCharacterImg: isCharacterImg, status: "ACTIVE" },
  });
}
