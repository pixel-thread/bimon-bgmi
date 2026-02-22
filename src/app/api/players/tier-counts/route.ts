import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";

/**
 * GET /api/players/tier-counts
 * Returns count of non-banned players grouped by category.
 */
export async function GET() {
    try {
        const counts = await prisma.player.groupBy({
            by: ["category"],
            where: { isBanned: false },
            _count: { _all: true },
        });

        const data: Record<string, number> = {};
        for (const row of counts) {
            data[row.category] = row._count._all;
        }

        return SuccessResponse({ data, cache: CACHE.MEDIUM });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch tier counts", error });
    }
}
