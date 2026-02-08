import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateBioSchema = z.object({
    bio: z.string().max(100, "Bio must be at most 100 characters").optional().nullable(),
});

// GET - Get current user's bio
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            select: { bio: true, category: true },
        });

        return SuccessResponse({
            data: {
                bio: player?.bio || null,
                category: player?.category || "NOOB",
            },
            message: "Bio fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// PATCH - Update user's bio
export async function PATCH(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const body = updateBioSchema.parse(await req.json());

        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const updatedPlayer = await prisma.player.update({
            where: { id: player.id },
            data: {
                bio: body.bio || null,
            },
            select: { bio: true },
        });

        return SuccessResponse({
            data: {
                bio: updatedPlayer.bio,
            },
            message: "Bio updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
