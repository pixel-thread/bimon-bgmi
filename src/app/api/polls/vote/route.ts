import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * POST /api/polls/vote
 * Cast or update a vote on a poll (IN/OUT/SOLO).
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { pollId, vote } = body as {
            pollId: string;
            vote: "IN" | "OUT" | "SOLO";
        };

        if (!pollId || !["IN", "OUT", "SOLO"].includes(vote)) {
            return ErrorResponse({
                message: "Invalid request: pollId and vote (IN/OUT/SOLO) required",
                status: 400,
            });
        }

        // Find the player
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({
                message: "Player profile not found",
                status: 404,
            });
        }

        const playerId = user.player.id;

        // Check poll is active
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
        });

        if (!poll || !poll.isActive) {
            return ErrorResponse({
                message: "Poll not found or no longer active",
                status: 404,
            });
        }

        // Upsert the vote
        const result = await prisma.playerPollVote.upsert({
            where: {
                playerId_pollId: {
                    playerId,
                    pollId,
                },
            },
            create: {
                playerId,
                pollId,
                vote,
            },
            update: {
                vote,
            },
        });

        return SuccessResponse({
            data: { id: result.id, vote: result.vote },
            message: "Vote cast successfully",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to cast vote", error });
    }
}
