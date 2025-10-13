import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.GalleryUpdateInput;
  id: string;
};

export async function updateGalleryImage({ data, id }: Props) {
  return await prisma.gallery.update({ where: { id: id }, data });
}
