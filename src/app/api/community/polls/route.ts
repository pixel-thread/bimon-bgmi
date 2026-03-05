import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail, getCurrentUser } from "@/lib/auth";

/**
 * GET /api/community/polls — List active community polls with vote counts.
 * POST /api/community/polls — Create a new poll.
 * PATCH /api/community/polls — Vote on an option, suggest option, or approve/reject suggestion.
 */

async function getPlayer() {
    const email = await getAuthEmail();
    if (!email) return null;
    const user = await prisma.user.findUnique({
        where: { email },
        select: { player: { select: { id: true } } },
    });
    return user?.player ?? null;
}

export async function GET() {
    try {
        const player = await getPlayer();
        if (!player) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const polls = await prisma.communityPoll.findMany({
            where: { isActive: true },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            take: 20,
            include: {
                player: { select: { id: true, displayName: true } },
                options: {
                    where: { isApproved: true },
                    orderBy: { createdAt: "asc" },
                    include: {
                        _count: { select: { votes: true } },
                        addedBy: { select: { id: true, displayName: true } },
                    },
                },
                _count: { select: { votes: true } },
            },
        });

        // Get current player's votes
        const myVotes = await prisma.communityPollVote.findMany({
            where: { playerId: player.id, pollId: { in: polls.map(p => p.id) } },
            select: { pollId: true, optionId: true },
        });
        const myVoteMap = new Map(myVotes.map(v => [v.pollId, v.optionId]));

        // Get pending suggestions for polls created by this player
        const myPollIds = polls.filter(p => p.playerId === player.id).map(p => p.id);
        const pendingSuggestions = myPollIds.length > 0
            ? await prisma.communityPollOption.findMany({
                where: { pollId: { in: myPollIds }, isApproved: false },
                include: { addedBy: { select: { displayName: true } } },
            })
            : [];

        const data = polls.map(p => ({
            id: p.id,
            question: p.question,
            isOwn: p.playerId === player.id,
            creatorName: p.player.displayName,
            totalVotes: p._count.votes,
            myVoteOptionId: myVoteMap.get(p.id) ?? null,
            isPinned: p.isPinned,
            createdAt: p.createdAt.toISOString(),
            options: p.options.map(o => ({
                id: o.id,
                text: o.text,
                votes: o._count.votes,
                addedBy: o.addedById !== p.playerId ? o.addedBy.displayName : null,
            })),
            pendingSuggestions: p.playerId === player.id
                ? pendingSuggestions.filter(s => s.pollId === p.id).map(s => ({
                    id: s.id,
                    text: s.text,
                    suggestedBy: s.addedBy.displayName,
                }))
                : [],
        }));

        return SuccessResponse({ data });
    } catch (error) {
        console.error("Error fetching community polls:", error);
        return ErrorResponse({ message: "Failed to fetch polls" });
    }
}

export async function POST(req: Request) {
    try {
        const player = await getPlayer();
        if (!player) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const body = await req.json();
        const { question, options } = body as { question: string; options: string[] };

        if (!question?.trim()) {
            return ErrorResponse({ message: "Question is required", status: 400 });
        }
        if (!options || options.length < 2) {
            return ErrorResponse({ message: "At least 2 options required", status: 400 });
        }
        if (options.length > 10) {
            return ErrorResponse({ message: "Maximum 10 options", status: 400 });
        }

        const poll = await prisma.communityPoll.create({
            data: {
                question: question.trim().slice(0, 200),
                playerId: player.id,
                options: {
                    create: options
                        .filter((o: string) => o.trim())
                        .map((o: string) => ({
                            text: o.trim().slice(0, 100),
                            addedById: player.id,
                            isApproved: true,
                        })),
                },
            },
        });

        return SuccessResponse({ message: "Poll created!", data: { pollId: poll.id } });
    } catch (error) {
        console.error("Error creating community poll:", error);
        return ErrorResponse({ message: "Failed to create poll" });
    }
}

export async function PATCH(req: Request) {
    try {
        const player = await getPlayer();
        if (!player) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const body = await req.json();
        const { action } = body;

        // ── Vote on an option ──
        if (action === "vote") {
            const { pollId, optionId } = body;

            // Verify option belongs to poll and is approved
            const option = await prisma.communityPollOption.findFirst({
                where: { id: optionId, pollId, isApproved: true },
            });
            if (!option) return ErrorResponse({ message: "Invalid option", status: 400 });

            // Upsert vote (change or create)
            await prisma.communityPollVote.upsert({
                where: { pollId_playerId: { pollId, playerId: player.id } },
                create: { pollId, optionId, playerId: player.id },
                update: { optionId },
            });

            return SuccessResponse({ message: "Vote recorded!" });
        }

        // ── Suggest a new option ──
        if (action === "suggest") {
            const { pollId, text } = body;

            if (!text?.trim()) {
                return ErrorResponse({ message: "Option text required", status: 400 });
            }

            const poll = await prisma.communityPoll.findUnique({
                where: { id: pollId },
                select: { playerId: true, isActive: true },
            });
            if (!poll || !poll.isActive) {
                return ErrorResponse({ message: "Poll not found", status: 404 });
            }

            // If creator suggests their own, auto-approve
            const isCreator = poll.playerId === player.id;

            await prisma.communityPollOption.create({
                data: {
                    pollId,
                    text: text.trim().slice(0, 100),
                    addedById: player.id,
                    isApproved: isCreator,
                },
            });

            // Notify poll creator if not self-suggestion
            if (!isCreator) {
                const creatorUser = await prisma.player.findUnique({
                    where: { id: poll.playerId },
                    select: { userId: true },
                });
                if (creatorUser) {
                    await prisma.notification.create({
                        data: {
                            userId: creatorUser.userId,
                            title: "New poll option suggested",
                            message: `Someone suggested "${text.trim()}" for your poll`,
                            type: "COMMUNITY",
                        },
                    });
                }
            }

            return SuccessResponse({
                message: isCreator ? "Option added!" : "Suggestion sent for approval!",
            });
        }

        // ── Approve/reject suggestion ──
        if (action === "approve" || action === "reject") {
            const { optionId } = body;

            const option = await prisma.communityPollOption.findUnique({
                where: { id: optionId },
                include: { poll: { select: { playerId: true } } },
            });

            if (!option) return ErrorResponse({ message: "Option not found", status: 404 });
            if (option.poll.playerId !== player.id) {
                return ErrorResponse({ message: "Only the poll creator can approve", status: 403 });
            }

            if (action === "approve") {
                await prisma.communityPollOption.update({
                    where: { id: optionId },
                    data: { isApproved: true },
                });
                return SuccessResponse({ message: "Option approved!" });
            } else {
                await prisma.communityPollOption.delete({
                    where: { id: optionId },
                });
                return SuccessResponse({ message: "Suggestion rejected" });
            }
        }

        // ── Close poll ──
        if (action === "close") {
            const { pollId } = body;
            const poll = await prisma.communityPoll.findUnique({
                where: { id: pollId },
                select: { playerId: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            if (poll.playerId !== player.id) {
                return ErrorResponse({ message: "Only the creator can close", status: 403 });
            }

            await prisma.communityPoll.update({
                where: { id: pollId },
                data: { isActive: false },
            });
            return SuccessResponse({ message: "Poll closed!" });
        }

        // ── Edit poll question ──
        if (action === "edit") {
            const { pollId, question } = body;
            if (!question?.trim()) {
                return ErrorResponse({ message: "Question required", status: 400 });
            }
            const poll = await prisma.communityPoll.findUnique({
                where: { id: pollId },
                select: { playerId: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            if (poll.playerId !== player.id) {
                return ErrorResponse({ message: "Only the creator can edit", status: 403 });
            }
            await prisma.communityPoll.update({
                where: { id: pollId },
                data: { question: question.trim().slice(0, 200) },
            });
            return SuccessResponse({ message: "Poll updated!" });
        }

        // ── Delete poll ──
        if (action === "delete") {
            const { pollId } = body;
            const poll = await prisma.communityPoll.findUnique({
                where: { id: pollId },
                select: { playerId: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            // Creator or super admin can delete
            const user = await getCurrentUser();
            if (poll.playerId !== player.id && user?.role !== "SUPER_ADMIN") {
                return ErrorResponse({ message: "Not authorized", status: 403 });
            }
            await prisma.communityPoll.delete({ where: { id: pollId } });
            return SuccessResponse({ message: "Poll deleted" });
        }

        // ── Pin/unpin poll (super admin only) ──
        if (action === "pin") {
            const user = await getCurrentUser();
            if (user?.role !== "SUPER_ADMIN") {
                return ErrorResponse({ message: "Only super admin can pin", status: 403 });
            }
            const { pollId } = body;
            const poll = await prisma.communityPoll.findUnique({
                where: { id: pollId },
                select: { isPinned: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            await prisma.communityPoll.update({
                where: { id: pollId },
                data: { isPinned: !poll.isPinned },
            });
            return SuccessResponse({ message: poll.isPinned ? "Unpinned" : "Pinned!" });
        }

        return ErrorResponse({ message: "Unknown action", status: 400 });
    } catch (error) {
        console.error("Error with community poll action:", error);
        return ErrorResponse({ message: "Failed to process action" });
    }
}
