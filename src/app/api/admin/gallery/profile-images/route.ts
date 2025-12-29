import { addGalleryImage } from "@/src/services/gallery/addGalleryImage";
import { getProfileImages } from "@/src/services/gallery/getProfileImages";
import { uploadImage } from "@/src/services/upload/uploadImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

const MAX_PROFILE_IMAGES = 20;

export async function GET(req: Request) {
    try {
        await adminMiddleware(req);
        const images = await getProfileImages();
        return SuccessResponse({ data: images });
    } catch (error) {
        return handleApiErrors(error);
    }
}

export async function POST(req: Request) {
    try {
        await adminMiddleware(req);

        const formData = await req.formData();
        const file = formData.get("image");

        if (!file || typeof file === "string") {
            return ErrorResponse({
                message: "No file or invalid file upload",
                status: 400,
            });
        }

        // Check maximum limit
        const existingImages = await getProfileImages();
        if (existingImages.length >= MAX_PROFILE_IMAGES) {
            return ErrorResponse({
                message: `Maximum ${MAX_PROFILE_IMAGES} profile images allowed`,
                status: 400,
            });
        }

        // Upload to Supabase storage
        const data = await uploadImage({
            file: file as File,
            bucketName: "profile-images",
        });

        // Save to database with isCharacterImg = true
        const gallery = await addGalleryImage({
            data: {
                imageId: data.id,
                name: data.fileName,
                path: data.path,
                publicUrl: data.url,
                fullPath: data.fullPath,
                isCharacterImg: true,
            },
        });

        return SuccessResponse({
            data: gallery,
            message: "Profile image uploaded successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
