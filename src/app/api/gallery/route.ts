import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";

/**
 * GET /api/gallery
 * Fetches gallery items.
 * ?type=background — only non-character images (for dashboard gallery)
 */
export async function GET(request: Request) {
    try {
        const userId = await getAuthEmail();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        const where: any = { status: "ACTIVE" };
        if (type === "background") {
            where.isCharacterImg = false;
        }

        const items = await prisma.gallery.findMany({
            where,
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

        return SuccessResponse({ data: items });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch gallery", error });
    }
}
