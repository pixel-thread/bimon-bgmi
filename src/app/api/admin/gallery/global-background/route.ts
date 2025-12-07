import { getGlobalBackground, setGlobalBackground, clearGlobalBackground } from "@/src/services/gallery/globalBackground";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

// GET - Fetch the global background (public endpoint)
export async function GET(req: Request) {
    try {
        await tokenMiddleware(req);
        const globalBackground = await getGlobalBackground();
        return SuccessResponse({
            data: globalBackground,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Set a gallery image as global background (admin only)
export async function POST(req: Request) {
    try {
        await adminMiddleware(req);
        const { galleryId } = await req.json();

        if (!galleryId) {
            return ErrorResponse({
                message: "Missing galleryId",
                status: 400,
            });
        }

        const result = await setGlobalBackground({ galleryId });
        return SuccessResponse({
            message: "Global background set successfully",
            data: result,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Clear the global background (admin only)
export async function DELETE(req: Request) {
    try {
        await adminMiddleware(req);
        await clearGlobalBackground();
        return SuccessResponse({
            message: "Global background cleared",
            data: null,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
