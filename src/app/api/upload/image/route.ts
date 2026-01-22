import { NextRequest } from "next/server";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { uploadToImgBB } from "@/src/services/upload/imgbb";

/**
 * POST /api/upload/image
 * 
 * Upload an image to ImgBB (free unlimited storage)
 * 
 * Body (multipart/form-data):
 * - image: File
 * - name?: string (optional name for the image)
 * 
 * OR Body (JSON):
 * - image: string (base64 encoded)
 * - name?: string
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        await tokenMiddleware(req);

        const contentType = req.headers.get("content-type") || "";

        let imageData: string;
        let imageName: string | undefined;

        if (contentType.includes("multipart/form-data")) {
            // Handle file upload
            const formData = await req.formData();
            const file = formData.get("image") as File | null;
            imageName = formData.get("name") as string | undefined;

            if (!file) {
                return ErrorResponse({ message: "No image provided", status: 400 });
            }

            // Convert file to base64
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            imageData = buffer.toString("base64");
        } else {
            // Handle JSON with base64
            const body = await req.json();

            if (!body.image) {
                return ErrorResponse({ message: "No image provided", status: 400 });
            }

            imageData = body.image;
            imageName = body.name;
        }

        // Upload to ImgBB
        const result = await uploadToImgBB(imageData, imageName);

        if (!result.success) {
            return ErrorResponse({
                message: result.error || "Failed to upload image",
                status: 500
            });
        }

        return SuccessResponse({
            message: "Image uploaded successfully",
            data: {
                url: result.url,
                thumbnailUrl: result.thumbnailUrl,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
