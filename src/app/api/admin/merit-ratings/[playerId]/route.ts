import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";

/**
 * GET /api/admin/merit-ratings/[playerId]
 * Get detailed merit ratings for a specific player
 * Super admin only endpoint
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { playerId } = await params;

        // Get player with their ratings
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            include: {
                user: {
                    select: {
                        displayName: true,
                        userName: true,
                    },
                },
                meritRatingsReceived: {
                    include: {
                        fromPlayer: {
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
                message: "Player not found",
                status: 404,
            });
        }

        // Get tournament info for each rating
        const tournamentIds = [
            ...new Set(player.meritRatingsReceived.map((r) => r.tournamentId)),
        ];
        const tournaments = await prisma.tournament.findMany({
            where: { id: { in: tournamentIds } },
            select: { id: true, name: true },
        });
        const tournamentMap = new Map(tournaments.map((t) => [t.id, t.name]));

        // Calculate stats
        const ratings = player.meritRatingsReceived;
        const avgRating =
            ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0;

        const formattedPlayer = {
            id: player.id,
            displayName: player.user.displayName || player.user.userName,
            userName: player.user.userName,
            meritScore: player.meritScore,
            isSoloRestricted: player.isSoloRestricted,
            totalRatings: ratings.length,
            averageRating: Math.round(avgRating * 10) / 10,
            ratings: ratings.map((r) => ({
                id: r.id,
                rater: {
                    id: r.fromPlayerId,
                    displayName:
                        r.fromPlayer.user.displayName || r.fromPlayer.user.userName,
                    userName: r.fromPlayer.user.userName,
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
            data: { player: formattedPlayer },
            message: "Player merit details fetched",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
