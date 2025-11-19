import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.GalleryCreateInput;
};
export async function addGalleryImage({ data }: Props) {
  return await prisma.gallery.create({ data });
}
