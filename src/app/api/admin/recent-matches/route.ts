import { createRecentMatchGroup } from "@/src/services/recentMatches/createRecentMatchGroup";
import { getRecentMatchGroups } from "@/src/services/recentMatches/getRecentMatchGroups";
import { uploadImage } from "@/src/services/upload/uploadImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { prisma } from "@/src/lib/db/prisma";

export async function GET(req: Request) {
    try {
        await adminMiddleware(req);
        const groups = await getRecentMatchGroups();
        return SuccessResponse({ data: groups });
    } catch (error) {
        return handleApiErrors(error);
    }
}

export async function POST(req: Request) {
    try {
        await adminMiddleware(req);

        const formData = await req.formData();
        const tournamentId = formData.get("tournamentId") as string;

        if (!tournamentId) {
            return ErrorResponse({ message: "Tournament ID is required", status: 400 });
        }

        // Verify tournament exists and get its name
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, name: true },
        });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

        // Process uploaded images
        // Format: matchNumber_index as key, file as value
        const uploadedImages: { matchNumber: number; imageUrl: string; imagePath: string }[] = [];

        const entries = Array.from(formData.entries());
        for (const [key, value] of entries) {
            if (key.startsWith("match_") && value instanceof File) {
                // Key format: match_1_0, match_1_1, match_2_0, etc.
                const parts = key.split("_");
                const matchNumber = parseInt(parts[1], 10);

                if (isNaN(matchNumber)) continue;

                const uploadResult = await uploadImage({
                    file: value,
                    bucketName: "scoreboards",
                });

                uploadedImages.push({
                    matchNumber,
                    imageUrl: uploadResult.url,
                    imagePath: uploadResult.path,
                });
            }
        }

        if (uploadedImages.length === 0) {
            return ErrorResponse({ message: "At least one image is required", status: 400 });
        }

        // Check if a group already exists for this tournament
        const existingGroup = await prisma.recentMatchGroup.findFirst({
            where: { tournamentId: tournament.id },
        });

        let group;
        if (existingGroup) {
            // Add images to existing group
            await prisma.recentMatchImage.createMany({
                data: uploadedImages.map((img) => ({
                    groupId: existingGroup.id,
                    matchNumber: img.matchNumber,
                    imageUrl: img.imageUrl,
                    imagePath: img.imagePath,
                })),
            });
            // Return updated group with all images
            group = await prisma.recentMatchGroup.findUnique({
                where: { id: existingGroup.id },
                include: { images: { orderBy: { matchNumber: "asc" } } },
            });
        } else {
            // Create new group with images
            group = await createRecentMatchGroup({
                tournamentId: tournament.id,
                tournamentTitle: tournament.name,
                deletionMarker: 0, // Not used - using time-based deletion (1 week)
                images: uploadedImages,
            });
        }

        return SuccessResponse({
            message: "Scoreboards uploaded successfully",
            data: group,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
