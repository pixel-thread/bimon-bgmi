import { NextResponse } from "next/server";
import { getPendingMeritRatings } from "@/src/services/merit/getPendingMeritRatings";
import { submitMeritRating, getPlayerMerit } from "@/src/services/merit/calculateMerit";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";

/**
 * GET /api/player/merit
 * Get pending teammates to rate + current merit status
 */
export async function GET(req: Request) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.player?.id;


        if (!playerId) {
            return ErrorResponse({
                message: "Player not found",
                status: 404,
            });
        }

        const [pending, merit] = await Promise.all([
            getPendingMeritRatings(playerId),
            getPlayerMerit(playerId),
        ]);


        return SuccessResponse({
            data: {
                pendingRatings: pending.pendingRatings,
                tournament: pending.tournament,
                merit: {
                    score: merit?.meritScore ?? 100,
                    isSoloRestricted: merit?.isSoloRestricted ?? false,
                    soloMatchesNeeded: merit?.soloMatchesNeeded ?? 0,
                },
            },
            status: 200,
            message: "Merit data fetched",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

/**
 * POST /api/player/merit
 * Submit a merit rating for a teammate
 * Body: { toPlayerId: string, rating: number, tournamentId: string }
 */
export async function POST(req: Request) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.player?.id;

        if (!playerId) {
            return ErrorResponse({
                message: "Player not found",
                status: 404,
            });
        }

        const body = await req.json();
        const { toPlayerId, rating, tournamentId } = body;

        if (!toPlayerId || !rating || !tournamentId) {
            return ErrorResponse({
                message: "Missing required fields",
                status: 400,
            });
        }

        if (rating < 1 || rating > 5) {
            return ErrorResponse({
                message: "Rating must be between 1 and 5",
                status: 400,
            });
        }

        await submitMeritRating(playerId, toPlayerId, tournamentId, rating);

        return SuccessResponse({
            message: "Rating submitted",
            data: { success: true },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
