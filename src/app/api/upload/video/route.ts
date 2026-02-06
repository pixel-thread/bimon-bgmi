import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * GET - Get Cloudinary upload configuration
 * Returns config for client-side upload
 */
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user.playerId) {
            return ErrorResponse({ message: "Player account required" });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            return ErrorResponse({
                message: "Video upload not configured. Please contact support.",
                status: 500
            });
        }

        // Return config for unsigned upload from browser
        // This is safe because upload preset controls what's allowed
        return SuccessResponse({
            data: {
                cloudName,
                uploadPreset,
                folder: "character-videos",
            },
            message: "Upload configuration retrieved",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

/**
 * POST - Same as GET, for flexibility
 */
export async function POST(req: NextRequest) {
    return GET(req);
}
