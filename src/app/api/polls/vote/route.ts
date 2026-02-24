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

        // Check if this is a first-time vote or a change
        const existingVote = await prisma.playerPollVote.findUnique({
            where: { playerId_pollId: { playerId, pollId } },
            select: { id: true },
        });
        const isFirstVote = !existingVote;

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
                createdAt: new Date(),
            },
        });

        // Lucky voter lottery — weighted by losses: biggest losers get highest chance
        let isLuckyVoter = poll.luckyVoterId === playerId;
        const entryFee = poll.tournament?.fee ?? 0;

        if (
            isFirstVote &&
            !isLuckyVoter &&
            !poll.luckyVoterId &&
            (vote === "IN" || vote === "SOLO") &&
            entryFee > 0
        ) {
            // Calculate this player's loss in the current season
            const seasonId = poll.tournament?.seasonId;
            let lossChance = 5; // base 5% for everyone

            if (seasonId) {
                // Get total fees paid in this season (team count × fee per tournament)
                const seasonTeams = await prisma.team.findMany({
                    where: {
                        seasonId,
                        players: { some: { id: playerId } },
                        tournament: { fee: { gt: 0 } },
                    },
                    select: {
                        tournament: { select: { fee: true } },
                    },
                });
                const totalFeesPaid = seasonTeams.reduce(
                    (sum, t) => sum + (t.tournament?.fee ?? 0),
                    0
                );

                // Get total prizes won in this season
                const prizeTransactions = await prisma.transaction.findMany({
                    where: {
                        playerId,
                        type: "CREDIT",
                        description: { contains: "place" },
                    },
                    select: { amount: true },
                });
                const totalPrizes = prizeTransactions.reduce(
                    (sum, t) => sum + t.amount,
                    0
                );

                // Net loss (positive = losing money)
                const netLoss = totalFeesPaid - totalPrizes;

                // Scale chance: 5% base → up to 40% for biggest losers
                // Every 30 UC of loss adds ~5% chance, capped at 40%
                if (netLoss > 0) {
                    lossChance = Math.min(40, 5 + Math.floor(netLoss / 30) * 5);
                }
            }

            const roll = Math.floor(Math.random() * 100);
            if (roll < lossChance) {
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
