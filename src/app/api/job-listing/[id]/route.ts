import { updateJobListing } from "@/src/services/jobListing/updateJobListing";
import { deleteJobListing } from "@/src/services/jobListing/deleteJobListing";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db/prisma";

const updateJobListingSchema = z.object({
    category: z.string().min(1).optional(),
    customCategory: z.string().max(30).optional(),
    title: z.string().min(1).max(50).optional(),
    description: z.string().max(150).optional(),
    phoneNumber: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

// PUT - Update a job listing
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const { id } = await params;

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const body = updateJobListingSchema.parse(await req.json());

        const listing = await updateJobListing({
            id,
            playerId: player.id,
            ...body,
        });

        return SuccessResponse({
            data: listing,
            message: "Job listing updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Delete a job listing
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const { id } = await params;

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        await deleteJobListing(id, player.id);

        return SuccessResponse({
            data: null,
            message: "Job listing deleted successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
