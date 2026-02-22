import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/polls
 * Fetches active polls with vote counts and user's vote status.
 * Uses the actual schema: Poll → PollOption → PlayerPollVote
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get("all") === "true";
        const seasonId = searchParams.get("seasonId");

        const user = await getCurrentUser();
        const playerId = user?.player?.id;

        const polls = await prisma.poll.findMany({
            where: {
                ...(all ? {} : { isActive: true }),
                ...(seasonId ? { tournament: { seasonId } } : {}),
            },
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

/**
 * POST /api/polls
 * Create a new poll (admin only).
 */
export async function POST(request: Request) {
    try {
        const { requireAdmin } = await import("@/lib/auth");
        const admin = await requireAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { question, days, teamType, tournamentId } = body;

        if (!question || !tournamentId) {
            return ErrorResponse({ message: "question and tournamentId are required", status: 400 });
        }

        const poll = await prisma.poll.create({
            data: {
                question,
                days: days || "Monday",
                teamType: teamType || "DUO",
                tournamentId,
                options: {
                    create: [
                        { name: "IN", vote: "IN" },
                        { name: "OUT", vote: "OUT" },
                        { name: "SOLO", vote: "SOLO" },
                    ],
                },
            },
            include: {
                tournament: { select: { id: true, name: true, fee: true } },
            },
        });

        return SuccessResponse({ data: poll });
    } catch (error) {
        return ErrorResponse({ message: "Failed to create poll", error });
    }
}

/**
 * PATCH /api/polls
 * Update an existing poll (admin only). Pass { id, ...fields }.
 */
export async function PATCH(request: Request) {
    try {
        const { requireAdmin } = await import("@/lib/auth");
        const admin = await requireAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { id, question, days, teamType, isActive } = body;

        if (!id) {
            return ErrorResponse({ message: "id is required", status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (question !== undefined) updateData.question = question;
        if (days !== undefined) updateData.days = days;
        if (teamType !== undefined) updateData.teamType = teamType;
        if (isActive !== undefined) updateData.isActive = isActive;

        if (Object.keys(updateData).length === 0) {
            return ErrorResponse({ message: "No fields to update", status: 400 });
        }

        const poll = await prisma.poll.update({
            where: { id },
            data: updateData,
            include: {
                tournament: { select: { id: true, name: true, fee: true } },
            },
        });

        return SuccessResponse({ data: poll });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update poll", error });
    }
}
