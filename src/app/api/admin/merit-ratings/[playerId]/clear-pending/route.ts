import { prisma } from "@/src/lib/db/prisma";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { getPendingMeritRatings } from "@/src/services/merit/getPendingMeritRatings";

/**
 * POST /api/admin/merit-ratings/[playerId]/clear-pending
 * 
 * Clears pending merit ratings for a player by auto-submitting 5-star ratings
 * for all teammates they haven't rated yet.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        await adminMiddleware(req);
        const { playerId } = await params;

        // Get player info for display
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            include: { user: { select: { displayName: true, userName: true } } }
        });

        if (!player) {
            return ErrorResponse({
                message: "Player not found",
                status: 404,
            });
        }

        // Get pending ratings
        const result = await getPendingMeritRatings(playerId);

        if (result.pendingRatings.length === 0) {
            return SuccessResponse({
                message: "No pending ratings to clear",
                data: { clearedCount: 0 },
            });
        }

        if (!result.tournament) {
            return ErrorResponse({
                message: "No tournament found for pending ratings",
                status: 400,
            });
        }

        // Submit 5-star ratings for each pending teammate
        const clearedRatings: string[] = [];
        for (const teammate of result.pendingRatings) {
            await prisma.playerMeritRating.create({
                data: {
                    fromPlayerId: playerId,
                    toPlayerId: teammate.playerId,
                    tournamentId: result.tournament.id,
                    rating: 5, // Default to 5 stars (generous)
                }
            });
            clearedRatings.push(teammate.displayName);
        }

        console.log(`[Admin] Cleared ${clearedRatings.length} pending ratings for ${player.user.displayName || player.user.userName}:`, clearedRatings);

        return SuccessResponse({
            message: `Cleared ${clearedRatings.length} pending ratings`,
            data: {
                clearedCount: clearedRatings.length,
                clearedFor: clearedRatings,
                tournamentName: result.tournament.name,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
