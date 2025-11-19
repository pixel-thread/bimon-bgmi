import { getGalleryImageById } from "@/src/services/gallery/getImageById";
import { removeGalleryImage } from "@/src/services/gallery/removeGalleryImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    await superAdminMiddleware(req);
    const imageExist = await getGalleryImageById({ id });
    if (!imageExist) {
      return ErrorResponse({
        message: "Image does not exist",
        status: 404,
      });
    }
    const deletedimage = await removeGalleryImage({
      image: imageExist,
      bucketName: "gallery",
    });
    return SuccessResponse({ data: deletedimage });
  } catch (error) {
    return handleApiErrors(error);
  }
}
