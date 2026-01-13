import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";

/**
 * GET /api/admin/merit-ratings/rater/[raterId]
 * Get all ratings given BY a specific player (as a rater)
 * Super admin only endpoint
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ raterId: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { raterId } = await params;

        // Get player (rater) with their ratings given
        const player = await prisma.player.findUnique({
            where: { id: raterId },
            include: {
                user: {
                    select: {
                        displayName: true,
                        userName: true,
                    },
                },
                meritRatingsGiven: {
                    include: {
                        toPlayer: {
                            include: {
                                user: {
                                    select: {
                                        displayName: true,
                                        userName: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!player) {
            return ErrorResponse({
                message: "Rater not found",
                status: 404,
            });
        }

        // Get tournament info for each rating
        const tournamentIds = [
            ...new Set(player.meritRatingsGiven.map((r) => r.tournamentId)),
        ];
        const tournaments = await prisma.tournament.findMany({
            where: { id: { in: tournamentIds } },
            select: { id: true, name: true },
        });
        const tournamentMap = new Map(tournaments.map((t) => [t.id, t.name]));

        // Calculate stats
        const ratings = player.meritRatingsGiven;
        const avgRating =
            ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0;

        const formattedRater = {
            id: player.id,
            displayName: player.user.displayName || player.user.userName,
            userName: player.user.userName,
            totalRatingsGiven: ratings.length,
            averageRatingGiven: Math.round(avgRating * 10) / 10,
            ratingsGiven: ratings.map((r) => ({
                id: r.id,
                ratedPlayer: {
                    id: r.toPlayerId,
                    displayName:
                        r.toPlayer.user.displayName || r.toPlayer.user.userName,
                    userName: r.toPlayer.user.userName,
                },
                rating: r.rating,
                tournament: {
                    id: r.tournamentId,
                    name: tournamentMap.get(r.tournamentId) || "Unknown",
                },
                createdAt: r.createdAt.toISOString(),
            })),
        };

        return SuccessResponse({
            data: { rater: formattedRater },
            message: "Rater details fetched",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
