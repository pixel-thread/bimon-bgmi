import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * POST /api/profile/update-ign
 * Updates the current player's display name (IGN) and/or bio.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const displayName = body.displayName?.trim();
        const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;

        // Validate displayName if provided
        if (displayName) {
            if (displayName.length < 2) {
                return ErrorResponse({ message: "Game Name must be at least 2 characters", status: 400 });
            }
            if (displayName.length > 14) {
                return ErrorResponse({ message: "Game Name must be 14 characters or less", status: 400 });
            }
        }

        // Validate bio if provided
        if (bio !== undefined && bio.length > 100) {
            return ErrorResponse({ message: "Bio must be 100 characters or less", status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Check for duplicate IGN if displayName is being changed
        if (displayName) {
            const existing = await prisma.player.findFirst({
                where: {
                    displayName: { equals: displayName, mode: "insensitive" },
                    id: { not: user.player.id },
                },
                select: { id: true },
            });

            if (existing) {
                return ErrorResponse({ message: "This Game Name is already taken", status: 409 });
            }
        }

        const updateData: Record<string, string> = {};
        if (displayName) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;

        if (Object.keys(updateData).length === 0) {
            return SuccessResponse({ message: "Nothing to update" });
        }

        await prisma.player.update({
            where: { id: user.player.id },
            data: updateData,
        });

        return SuccessResponse({ message: "Profile updated" });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update profile", error });
    }
}
