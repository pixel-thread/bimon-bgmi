import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};

export async function getGalleryImageById({ id }: Props) {
  return prisma.gallery.findUnique({ where: { id } });
}
