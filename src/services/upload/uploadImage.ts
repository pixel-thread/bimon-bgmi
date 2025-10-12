import { ALLOWED_FILE_SIZE } from "@/src/lib/constant/allowed-file-size";
import { ALLOWED_IMAGE_TYPE } from "@/src/lib/constant/allowed-image-type";
import { supabaseClient } from "@/src/lib/supabase";

type Props = {
  file: File;
  bucketName?: string;
};

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

export async function uploadImage({ file, bucketName }: Props) {
  // Validate file type and size (optional but recommended)
  const name = `${defaultBucket}/${bucketName}`;
  const allowedTypes = ALLOWED_IMAGE_TYPE;
  const maxSize = ALLOWED_FILE_SIZE;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image type");
  }

  if (file.size > maxSize) {
    throw new Error("File too large");
  }

  const fileExt = file.type.split("/")[1];

  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  // Upload the file
  const { data, error } = await supabaseClient.storage
    .from(name)
    .upload(fileName, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: publicData } = supabaseClient.storage
    .from(name)
    .getPublicUrl(fileName);

  return {
    path: data?.path,
    url: publicData?.publicUrl,
    fileName,
    fullPath: data.fullPath,
  };
}
