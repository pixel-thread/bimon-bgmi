import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { supabaseClient } from "@/src/lib/supabase";
import { logger } from "@/src/utils/logger";

type Props = {
  bucketName?: string;
  image: Prisma.GalleryCreateInput;
};

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

export async function removeGalleryImage({
  image,
  bucketName = "gallery",
}: Props) {
  const name = `${defaultBucket}/${bucketName}` || defaultBucket;

  const { error, data } = await supabaseClient.storage
    .from(name)
    .remove([image.fullPath, image.path]);

  if (error) {
    //BUG: Handle error
    logger.error(error);
  }

  logger.log({
    data,
  });

  return await prisma.gallery.delete({ where: { id: image.id } });
}
