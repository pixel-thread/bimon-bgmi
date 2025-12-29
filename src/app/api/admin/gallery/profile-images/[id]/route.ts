import { deleteProfileImage } from "@/src/services/gallery/deleteProfileImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

type RouteParams = {
    params: Promise<{ id: string }>;
};

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        await adminMiddleware(req);

        const { id } = await params;
        const url = new URL(req.url);
        const force = url.searchParams.get("force") === "true";

        if (!id) {
            return ErrorResponse({ message: "Image ID is required", status: 400 });
        }

        const result = await deleteProfileImage(id, force);

        if (!result.success) {
            // Return player info if deletion requires force
            return ErrorResponse({
                message: result.message,
                status: 400,
                data: result.requiresForce ? {
                    playersUsing: result.playersUsing,
                    requiresForce: true,
                } : undefined,
            });
        }

        return SuccessResponse({ message: result.message });
    } catch (error) {
        return handleApiErrors(error);
    }
}

