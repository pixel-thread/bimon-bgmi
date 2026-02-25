import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * POST /api/polls/rate-merit
 * Submit a merit rating for a teammate from a specific tournament.
 *
 * Body: { toPlayerId: string, tournamentId: string, rating: number (1-5) }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { toPlayerId, tournamentId, rating } = body as {
            toPlayerId: string;
            tournamentId: string;
            rating: number;
        };

        if (!toPlayerId || !tournamentId || !rating) {
            return ErrorResponse({
                message: "toPlayerId, tournamentId, and rating are required",
                status: 400,
            });
        }

        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return ErrorResponse({
                message: "Rating must be an integer between 1 and 5",
                status: 400,
            });
        }

        // Get current player
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player profile not found", status: 404 });
        }

        const fromPlayerId = user.player.id;

        if (fromPlayerId === toPlayerId) {
            return ErrorResponse({ message: "Cannot rate yourself", status: 400 });
        }

        // Get the tournament's season
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { seasonId: true },
        });

        // Upsert the merit rating
        await prisma.playerMeritRating.upsert({
            where: {
                fromPlayerId_toPlayerId_tournamentId: {
                    fromPlayerId,
                    toPlayerId,
                    tournamentId,
                },
            },
            create: {
                fromPlayerId,
                toPlayerId,
                tournamentId,
                seasonId: tournament?.seasonId ?? null,
                rating,
            },
            update: {
                rating,
            },
        });

        // Recalculate the target player's merit score based on all ratings received
        const allRatingsReceived = await prisma.playerMeritRating.findMany({
            where: { toPlayerId },
            select: { rating: true },
        });

        if (allRatingsReceived.length > 0) {
            const avg =
                allRatingsReceived.reduce((sum, r) => sum + r.rating, 0) /
                allRatingsReceived.length;
            // Convert 1-5 scale to 0-100 merit score
            const meritScore = Math.round((avg / 5) * 100);

            await prisma.player.update({
                where: { id: toPlayerId },
                data: { meritScore },
            });
        }

        return SuccessResponse({
            data: { success: true },
            message: "Merit rating submitted",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to submit merit rating", error });
    }
}
