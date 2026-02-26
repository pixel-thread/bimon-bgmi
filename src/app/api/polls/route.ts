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
                        seasonId: true,
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
                        createdAt: true,
                        player: {
                            select: {
                                displayName: true,
                                customProfileImageUrl: true,
                                user: {
                                    select: {
                                        username: true,
                                        imageUrl: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
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
                luckyVoterId: poll.luckyVoterId,
                options: poll.options,
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
                playersVotes: poll.votes.map((v) => ({
                    playerId: v.playerId,
                    vote: v.vote,
                    createdAt: v.createdAt,
                    displayName: v.player.displayName ?? v.player.user?.username ?? "Unknown",
                    imageUrl: v.player.customProfileImageUrl ?? v.player.user?.imageUrl ?? "",
                })),
            };
        });

        return SuccessResponse({ data: { polls: data, currentPlayerId: playerId ?? null }, cache: CACHE.NONE });
    } catch (error) {
        console.error("[GET /api/polls] Error:", error);
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
                        { name: "Nga Leh 😎", vote: "IN" },
                        { name: "Leh rei, I'm ge 🏳️‍🌈", vote: "OUT" },
                        { name: "Nga Leh solo 🫩", vote: "SOLO" },
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
        const { id, question, days, teamType, isActive, options } = body;

        if (!id) {
            return ErrorResponse({ message: "id is required", status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (question !== undefined) updateData.question = question;
        if (days !== undefined) updateData.days = days;
        if (teamType !== undefined) updateData.teamType = teamType;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update poll + options in a transaction
        const poll = await prisma.$transaction(async (tx) => {
            // Update poll fields if any
            let updatedPoll;
            if (Object.keys(updateData).length > 0) {
                updatedPoll = await tx.poll.update({
                    where: { id },
                    data: updateData,
                    include: {
                        tournament: { select: { id: true, name: true, fee: true } },
                        options: { select: { id: true, name: true, vote: true } },
                    },
                });
            } else {
                updatedPoll = await tx.poll.findUniqueOrThrow({
                    where: { id },
                    include: {
                        tournament: { select: { id: true, name: true, fee: true } },
                        options: { select: { id: true, name: true, vote: true } },
                    },
                });
            }

            // Update option names if provided
            if (options && Array.isArray(options)) {
                for (const opt of options) {
                    if (opt.id && opt.name !== undefined) {
                        await tx.pollOption.update({
                            where: { id: opt.id },
                            data: { name: opt.name },
                        });
                    }
                }
                // Re-fetch to get updated options
                updatedPoll = await tx.poll.findUniqueOrThrow({
                    where: { id },
                    include: {
                        tournament: { select: { id: true, name: true, fee: true } },
                        options: { select: { id: true, name: true, vote: true } },
                    },
                });
            }

            return updatedPoll;
        });

        return SuccessResponse({ data: poll });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update poll", error });
    }
}
