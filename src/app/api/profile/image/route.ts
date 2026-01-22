import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateImageSchema = z.object({
    // "google" = use Google image, "custom" = use a gallery image, "uploaded" = use user-uploaded image
    imageType: z.enum(["google", "custom", "uploaded"]),
    // Required when imageType is "custom"
    customImageId: z.string().optional(),
    // Required when imageType is "uploaded"
    uploadedImageUrl: z.string().url().optional(),
});

// GET - Get current profile image settings
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        // Get player with character image
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            include: { characterImage: true },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Determine current image type
        let imageType: "google" | "custom" | "uploaded" = "google";
        if (player.customProfileImageUrl) {
            imageType = "uploaded";
        } else if (player.characterImageId && player.characterImageId !== "none") {
            imageType = "custom";
        }

        return SuccessResponse({
            data: {
                imageType,
                customImageId: player.characterImageId !== "none" ? player.characterImageId : null,
                customImage: player.characterImage,
                uploadedImageUrl: player.customProfileImageUrl,
            },
            message: "Profile image settings fetched",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// PATCH - Update profile image selection
export async function PATCH(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const body = updateImageSchema.parse(await req.json());

        // Get player
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        let characterImageId: string | null = null;
        let customProfileImageUrl: string | null = null;

        switch (body.imageType) {
            case "google":
                // Clear both custom image selections
                characterImageId = null;
                customProfileImageUrl = null;
                break;
            case "custom":
                if (!body.customImageId) {
                    return ErrorResponse({
                        message: "Custom image ID is required",
                        status: 400,
                    });
                }
                // Verify the image exists and is a character image
                const image = await prisma.gallery.findFirst({
                    where: {
                        id: body.customImageId,
                        isCharacterImg: true,
                        status: "ACTIVE",
                    },
                });
                if (!image) {
                    return ErrorResponse({
                        message: "Invalid image selection",
                        status: 400,
                    });
                }
                characterImageId = body.customImageId;
                customProfileImageUrl = null; // Clear uploaded image
                break;
            case "uploaded":
                if (!body.uploadedImageUrl) {
                    return ErrorResponse({
                        message: "Uploaded image URL is required",
                        status: 400,
                    });
                }
                // Store the Google Drive URL
                customProfileImageUrl = body.uploadedImageUrl;
                characterImageId = null; // Clear gallery selection
                break;
        }

        // Update player
        const updatedPlayer = await prisma.player.update({
            where: { id: player.id },
            data: {
                characterImageId,
                customProfileImageUrl,
            },
            include: { characterImage: true },
        });

        return SuccessResponse({
            data: {
                imageType: body.imageType,
                customImageId: characterImageId,
                customImage: updatedPlayer.characterImage,
                uploadedImageUrl: customProfileImageUrl,
            },
            message: "Profile image updated",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
