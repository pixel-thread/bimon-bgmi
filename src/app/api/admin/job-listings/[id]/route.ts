import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// PATCH - Unban a job listing
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await adminMiddleware(req);

        const { id } = await params;

        // Find the listing
        const listing = await prisma.playerJobListing.findUnique({
            where: { id },
        });

        if (!listing) {
            return ErrorResponse({
                message: "Job listing not found",
                status: 404,
            });
        }

        // Unban the listing
        const updatedListing = await prisma.playerJobListing.update({
            where: { id },
            data: {
                isJobBanned: false,
                isActive: true,
                dislikeCount: 0, // Reset dislikes to prevent immediate re-ban
            },
        });

        return SuccessResponse({
            data: updatedListing,
            message: "Job listing unbanned successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Delete a job listing (admin)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await adminMiddleware(req);

        const { id } = await params;

        await prisma.playerJobListing.delete({
            where: { id },
        });

        return SuccessResponse({
            message: "Job listing deleted successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
