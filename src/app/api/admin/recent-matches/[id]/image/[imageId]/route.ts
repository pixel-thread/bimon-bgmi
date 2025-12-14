import { prisma } from "@/src/lib/db/prisma";
import { supabaseClient } from "@/src/lib/supabase";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

// DELETE - Delete a single image from a group
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    try {
        await adminMiddleware(req);
        const { id, imageId } = await params;

        if (!id || !imageId) {
            return ErrorResponse({ message: "Group ID and Image ID are required", status: 400 });
        }

        // Get the image
        const image = await prisma.recentMatchImage.findUnique({
            where: { id: imageId, groupId: id },
        });

        if (!image) {
            return ErrorResponse({ message: "Image not found", status: 404 });
        }

        // Delete from storage
        const bucketName = `${defaultBucket}/scoreboards`;
        await supabaseClient.storage.from(bucketName).remove([image.imagePath]);

        // Delete from database
        await prisma.recentMatchImage.delete({
            where: { id: imageId },
        });

        return SuccessResponse({
            message: "Image deleted successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
