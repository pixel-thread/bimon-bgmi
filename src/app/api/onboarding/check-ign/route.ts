"use server";

import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";

/**
 * Lightweight endpoint to check if a displayName (BGMI IGN) is already taken.
 * Used during onboarding to give instant feedback after pasting.
 */
export async function GET(req: Request) {
    try {
        const user = await tokenMiddleware(req);

        const { searchParams } = new URL(req.url);
        const displayName = searchParams.get("displayName")?.trim();

        if (!displayName) {
            return ErrorResponse({
                message: "displayName is required",
                status: 400,
            });
        }

        // Case-insensitive check for existing displayName
        const existingUser = await prisma.user.findFirst({
            where: {
                displayName: {
                    equals: displayName,
                    mode: "insensitive",
                },
                id: { not: user.id }, // Exclude the current user
            },
            select: { id: true },
        });

        return SuccessResponse({
            data: { isTaken: !!existingUser },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
