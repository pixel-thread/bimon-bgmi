import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";

/**
 * GET /api/recent-matches
 * Fetches recent match scoreboards grouped by tournament.
 */
export async function GET() {
    try {
        const groups = await prisma.recentMatchGroup.findMany({
            include: {
                images: {
                    orderBy: { matchNumber: "asc" },
                    select: {
                        id: true,
                        imageUrl: true,
                        matchNumber: true,
                    },
                },
                tournament: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const data = groups.map((g) => ({
            id: g.id,
            tournamentTitle: g.tournamentTitle,
            tournament: g.tournament,
            images: g.images.map((img) => ({
                id: img.id,
                url: img.imageUrl,
                matchNumber: img.matchNumber,
            })),
            createdAt: g.createdAt,
        }));

        return SuccessResponse({ data, cache: CACHE.MEDIUM });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch recent matches",
            error,
        });
    }
}
