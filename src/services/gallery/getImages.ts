import { prisma } from "@/src/lib/db/prisma";

export async function getGalleryImages() {
  return await prisma.gallery.findMany();
}
