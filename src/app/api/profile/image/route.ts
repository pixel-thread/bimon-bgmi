import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateImageSchema = z.object({
    // "google" = use Google/Clerk image, "uploaded" = use user-uploaded image
    imageType: z.enum(["google", "uploaded"]),
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

        // Get player with character image info
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            select: {
                customProfileImageUrl: true,
                characterImageId: true,
            },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Determine current image type for profile (circle avatar)
        // Only check customProfileImageUrl - characterImageId is for the podium card background
        let imageType: "google" | "uploaded" = "google";
        if (player.customProfileImageUrl) {
            imageType = "uploaded";
        }

        return SuccessResponse({
            data: {
                imageType,
                uploadedImageUrl: player.customProfileImageUrl,
                hasCharacterImage: !!player.characterImageId,
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

        let customProfileImageUrl: string | null = null;

        switch (body.imageType) {
            case "google":
                // Clear uploaded profile image - will use Google/Clerk image
                customProfileImageUrl = null;
                break;
            case "uploaded":
                if (!body.uploadedImageUrl) {
                    return ErrorResponse({
                        message: "Uploaded image URL is required",
                        status: 400,
                    });
                }
                // Store the uploaded URL
                customProfileImageUrl = body.uploadedImageUrl;
                break;
        }

        // Update player - only update customProfileImageUrl, NOT characterImageId
        // characterImageId is for the 9:16 podium card background, not the profile picture
        await prisma.player.update({
            where: { id: player.id },
            data: {
                customProfileImageUrl,
            },
        });

        return SuccessResponse({
            data: {
                imageType: body.imageType,
                uploadedImageUrl: customProfileImageUrl,
            },
            message: "Profile image updated",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
