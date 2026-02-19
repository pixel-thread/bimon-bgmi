import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/gallery
 * Fetches all gallery items.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const items = await prisma.gallery.findMany({
            where: { status: "ACTIVE" },
            orderBy: { isCharacterImg: "desc" },
            select: {
                id: true,
                name: true,
                publicUrl: true,
                isCharacterImg: true,
                isAnimated: true,
                isVideo: true,
                status: true,
            },
        });

        return SuccessResponse({ data: items, cache: CACHE.MEDIUM });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch gallery", error });
    }
}
