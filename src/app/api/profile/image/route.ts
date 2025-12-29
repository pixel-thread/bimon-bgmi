import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateImageSchema = z.object({
    // "google" = use Google image, "none" = no image (initials), "custom" = use a custom image
    imageType: z.enum(["google", "none", "custom"]),
    // Required when imageType is "custom"
    customImageId: z.string().optional(),
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
        let imageType: "google" | "none" | "custom" = "google";
        if (player.characterImageId === "none") {
            imageType = "none";
        } else if (player.characterImageId) {
            imageType = "custom";
        }

        return SuccessResponse({
            data: {
                imageType,
                customImageId: player.characterImageId !== "none" ? player.characterImageId : null,
                customImage: player.characterImage,
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

        switch (body.imageType) {
            case "google":
                characterImageId = null;
                break;
            case "none":
                // Use a special identifier for "no image"
                characterImageId = "none";
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
                break;
        }

        // Update player
        const updatedPlayer = await prisma.player.update({
            where: { id: player.id },
            data: { characterImageId },
            include: { characterImage: true },
        });

        return SuccessResponse({
            data: {
                imageType: body.imageType,
                customImageId: characterImageId !== "none" ? characterImageId : null,
                customImage: updatedPlayer.characterImage,
            },
            message: "Profile image updated",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
