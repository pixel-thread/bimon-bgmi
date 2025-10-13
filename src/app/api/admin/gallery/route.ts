import { addGalleryImage } from "@/src/services/gallery/addGalleryImage";
import { getGalleryImages } from "@/src/services/gallery/getImages";
import { uploadImage } from "@/src/services/upload/uploadImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
export async function GET(req: Request) {
  try {
    await superAdminMiddleware(req);
    const images = await getGalleryImages();
    return SuccessResponse({
      data: images,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);
    // Parse multipart/form-data for file upload
    const formData = await req.formData();

    const file = formData.get("image");

    // @ts-ignore
    if (!file || !(file instanceof Blob || file instanceof File)) {
      return ErrorResponse({
        message: "No file or invalid file upload",
      });
    }

    const images = await getGalleryImages();
    if (images.length === 5) {
      return ErrorResponse({
        message: "Gallery is full",
        status: 400,
      });
    }

    const data = await uploadImage({ file });

    const gallery = await addGalleryImage({
      data: {
        imageId: data.id,
        name: data.fileName,
        path: data.path,
        publicUrl: data.url,
        fullPath: data.fullPath,
      },
    });
    return SuccessResponse({ data: gallery });
  } catch (error) {
    return handleApiErrors(error);
  }
}
