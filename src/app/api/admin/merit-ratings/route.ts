import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";

/**
 * GET /api/admin/merit-ratings
 * Get all players with their merit scores, sorted lowest to highest
 * With details of who rated them
 * Super admin only endpoint
 */
export async function GET(req: Request) {
    try {
        await superAdminMiddleware(req);

        const { searchParams } = new URL(req.url);
        const tournamentId = searchParams.get("tournamentId");

        // Get all players with their merit scores and ratings received
        const players = await prisma.player.findMany({
            where: {
                meritRatingsReceived: {
                    some: tournamentId ? { tournamentId } : {},
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
                    where: tournamentId ? { tournamentId } : {},
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

        // Get all tournaments for filter dropdown
        const allTournaments = await prisma.tournament.findMany({
            select: { id: true, name: true },
            orderBy: { startDate: "desc" },
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
                tournaments: allTournaments,
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
