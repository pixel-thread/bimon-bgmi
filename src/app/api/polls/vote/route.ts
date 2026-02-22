import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * POST /api/polls/vote
 * Cast or update a vote on a poll (IN/OUT/SOLO).
 * Optimized: runs player + poll lookups in parallel.
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

        // Run player + poll lookups in parallel (saves ~100ms)
        const [user, poll] = await Promise.all([
            prisma.user.findUnique({
                where: { clerkId: userId },
                select: {
                    player: {
                        select: {
                            id: true,
                            isBanned: true,
                        },
                    },
                },
            }),
            prisma.poll.findUnique({
                where: { id: pollId },
                select: {
                    id: true,
                    isActive: true,
                    luckyVoterId: true,
                    tournament: { select: { fee: true, seasonId: true } },
                },
            }),
        ]);

        if (!user?.player) {
            return ErrorResponse({
                message: "Player profile not found",
                status: 404,
            });
        }

        if (user.player.isBanned) {
            return ErrorResponse({
                message: "Banned players cannot vote",
                status: 403,
            });
        }

        if (!poll || !poll.isActive) {
            return ErrorResponse({
                message: "Poll not found or no longer active",
                status: 404,
            });
        }

        const playerId = user.player.id;

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

        // Lucky voter lottery — 15% chance, only for IN/SOLO, only if no winner yet
        let isLuckyVoter = poll.luckyVoterId === playerId;
        const entryFee = poll.tournament?.fee ?? 0;

        if (
            !isLuckyVoter &&
            !poll.luckyVoterId &&
            (vote === "IN" || vote === "SOLO") &&
            entryFee > 0
        ) {
            const roll = Math.floor(Math.random() * 100);
            if (roll < 15) {
                await prisma.poll.update({
                    where: { id: pollId },
                    data: { luckyVoterId: playerId },
                });
                isLuckyVoter = true;
            }
        }

        return SuccessResponse({
            data: { id: result.id, vote: result.vote, isLuckyVoter },
            message: isLuckyVoter
                ? "🎉 Congratulations! You won FREE ENTRY!"
                : "Vote cast successfully",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to cast vote", error });
    }
}
