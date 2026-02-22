import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * GET /api/onboarding/check-ign?displayName=xxx
 * Checks if a BGMI IGN is already taken (case-insensitive).
 * Used during onboarding to give instant feedback after pasting.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const displayName = searchParams.get("displayName");

        if (!displayName || displayName.trim().length < 2) {
            return ErrorResponse({ message: "displayName is required", status: 400 });
        }

        const existing = await prisma.player.findFirst({
            where: {
                displayName: {
                    equals: displayName.trim(),
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        return SuccessResponse({
            data: { isTaken: !!existing },
        });
    } catch (error) {
        return ErrorResponse({ message: "Check failed", error });
    }
}
