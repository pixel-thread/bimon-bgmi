import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/polls
 * Fetches active polls with vote counts and user's vote status.
 * Uses the actual schema: Poll → PollOption → PlayerPollVote
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        const playerId = user?.player?.id;

        const polls = await prisma.poll.findMany({
            where: { isActive: true },
            include: {
                tournament: {
                    select: {
                        id: true,
                        name: true,
                        fee: true,
                    },
                },
                options: {
                    select: {
                        id: true,
                        name: true,
                        vote: true,
                    },
                },
                votes: {
                    select: {
                        id: true,
                        playerId: true,
                        vote: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const data = polls.map((poll) => {
            const totalVotes = poll.votes.length;
            const inVotes = poll.votes.filter((v) => v.vote === "IN").length;
            const outVotes = poll.votes.filter((v) => v.vote === "OUT").length;
            const soloVotes = poll.votes.filter((v) => v.vote === "SOLO").length;
            const userVote = playerId
                ? poll.votes.find((v) => v.playerId === playerId)?.vote ?? null
                : null;

            return {
                id: poll.id,
                question: poll.question,
                days: poll.days,
                teamType: poll.teamType,
                tournament: poll.tournament,
                isActive: poll.isActive,
                createdAt: poll.createdAt,
                totalVotes,
                inVotes,
                outVotes,
                soloVotes,
                inPercentage:
                    totalVotes > 0 ? Math.round((inVotes / totalVotes) * 100) : 0,
                userVote,
                hasVoted: !!userVote,
            };
        });

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch polls", error });
    }
}
