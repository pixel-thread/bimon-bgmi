import { addGalleryImage } from "@/src/services/gallery/addGalleryImage";
import { updatePlayerChracterImage } from "@/src/services/player/updatePlayerChracterImage";
import { uploadImage } from "@/src/services/upload/uploadImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const playerId = (await params).id;
    const formData = await req.formData();

    const file = formData.get("image");

    // @ts-ignore
    if (!file || !(file instanceof Blob || file instanceof File)) {
      return ErrorResponse({
        message: "No file or invalid file upload",
      });
    }

    const data = await uploadImage({ file, bucketName: "characters" });
    const gallary = await addGalleryImage({
      data: {
        imageId: data.id,
        name: data.fileName,
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: data.url,
        isCharacterImg: true,
      },
    });
    const chracter = await updatePlayerChracterImage({
      id: playerId,
      galleryId: gallary.id,
    });
    return SuccessResponse({ data: chracter });
  } catch (error) {
    return handleApiErrors(error);
  }
}
