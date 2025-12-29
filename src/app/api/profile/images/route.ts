import { getProfileImages } from "@/src/services/gallery/getProfileImages";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";

// Public endpoint - get all available profile images for players
export async function GET() {
    try {
        const images = await getProfileImages();
        return SuccessResponse({ data: images });
    } catch (error) {
        return handleApiErrors(error);
    }
}
