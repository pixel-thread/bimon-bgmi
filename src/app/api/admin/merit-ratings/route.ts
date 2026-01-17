import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";

/**
 * GET /api/admin/merit-ratings
 * Get all players with their merit scores, sorted lowest to highest
 * Only shows ratings from the ACTIVE season
 * Super admin only endpoint
 */
export async function GET(req: Request) {
    try {
        await superAdminMiddleware(req);

        // Get active season - only show ratings from current season
        const activeSeason = await getActiveSeason();

        if (!activeSeason) {
            return SuccessResponse({
                data: {
                    players: [],
                    seasonName: null,
                    summary: {
                        totalPlayers: 0,
                        restrictedPlayers: 0,
                        totalRatings: 0,
                    },
                },
                message: "No active season found",
            });
        }

        // Get all players with their merit scores and ratings received (from current season only)
        const players = await prisma.player.findMany({
            where: {
                meritRatingsReceived: {
                    some: { seasonId: activeSeason.id },
                },
            },
            include: {
                user: {
                    select: {
                        displayName: true,
                        userName: true,
                    },
                },
                meritRatingsReceived: {
                    where: { seasonId: activeSeason.id },
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
            orderBy: {
                meritScore: "asc", // Lowest to highest
            },
        });

        // Get tournament info for each rating
        const tournamentIds = [
            ...new Set(
                players.flatMap((p) =>
                    p.meritRatingsReceived.map((r) => r.tournamentId)
                )
            ),
        ];
        const tournaments = await prisma.tournament.findMany({
            where: { id: { in: tournamentIds } },
            select: { id: true, name: true },
        });
        const tournamentMap = new Map(tournaments.map((t) => [t.id, t.name]));

        // Format response - players with their ratings
        const formattedPlayers = players.map((player) => {
            const ratings = player.meritRatingsReceived;
            const avgRating =
                ratings.length > 0
                    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                    : 0;

            return {
                id: player.id,
                displayName: player.user.displayName || player.user.userName,
                userName: player.user.userName,
                meritScore: player.meritScore, // 0-100 percentage
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
        });

        // Summary stats
        const totalPlayers = formattedPlayers.length;
        const restrictedPlayers = formattedPlayers.filter(
            (p) => p.isSoloRestricted
        ).length;
        const totalRatings = formattedPlayers.reduce(
            (sum, p) => sum + p.totalRatings,
            0
        );

        return SuccessResponse({
            data: {
                players: formattedPlayers,
                seasonName: activeSeason.name,
                summary: {
                    totalPlayers,
                    restrictedPlayers,
                    totalRatings,
                },
            },
            message: "Merit ratings fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

