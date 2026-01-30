"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db/prisma";
import { addGalleryImage } from "@/src/services/gallery/addGalleryImage";
import { updatePlayerChracterImage } from "@/src/services/player/updatePlayerChracterImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const { imageUrl, isAnimated = false, thumbnailUrl } = body;

        if (!imageUrl) {
            return ErrorResponse({ message: "Image URL is required", status: 400 });
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { player: true },
        });

        if (!user?.playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Create gallery entry for the character image using existing service
        // Use a unique ID for imageId since we're using external URL
        const uniqueId = `imgbb_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const galleryImage = await addGalleryImage({
            data: {
                imageId: uniqueId,
                name: `character_${user.playerId}_${Date.now()}`,
                path: imageUrl,
                fullPath: imageUrl,
                publicUrl: imageUrl,
                isCharacterImg: true,
                isAnimated: isAnimated,
                thumbnailUrl: thumbnailUrl || null,
            },
        });

        // Update player's character image using existing service
        const updatedPlayer = await updatePlayerChracterImage({
            id: user.playerId,
            galleryId: galleryImage.id,
        });

        return SuccessResponse({
            data: { characterImage: updatedPlayer },
            message: "Character image updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
