/* eslint-disable @typescript-eslint/no-explicit-any */
import { communityDb } from "@/lib/community-db";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/database";

const GAME = process.env.NEXT_PUBLIC_GAME_MODE || "bgmi";

/**
 * Resolve the current player's email + display name from the local DB.
 */
async function getPlayerInfo() {
    const email = await getAuthEmail();
    if (!email) return null;
    const user = await prisma.user.findFirst({
        where: { OR: [{ email }, { secondaryEmail: email }] },
        select: {
            email: true,
            username: true,
            imageUrl: true,
            player: { select: { id: true, displayName: true, customProfileImageUrl: true } },
        },
    });
    if (!user?.player) return null;
    return {
        email: user.email!,
        displayName: user.player.displayName || user.username || "Unknown",
        imageUrl: user.player.customProfileImageUrl || user.imageUrl || "",
        playerId: user.player.id,
    };
}

/**
 * GET /api/community/polls — List active community polls (central DB).
 */
export async function GET() {
    try {
        const info = await getPlayerInfo();
        if (!info) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const polls = await communityDb.centralCommunityPoll.findMany({
            where: { isActive: true },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            take: 20,
            include: {
                options: {
                    where: { isApproved: true },
                    orderBy: { createdAt: "asc" },
                    include: {
                        _count: { select: { votes: true } },
                    },
                },
                _count: { select: { votes: true } },
            },
        });

        // Get current player's votes
        const myVotes = await communityDb.centralCommunityPollVote.findMany({
            where: { email: info.email, pollId: { in: polls.map((p: any) => p.id) } },
            select: { pollId: true, optionId: true },
        });
        const myVoteMap = new Map(myVotes.map((v: any) => [v.pollId, v.optionId]));

        // Get pending suggestions for polls created by this player
        const myPollIds = polls.filter((p: any) => p.email === info.email).map((p: any) => p.id);
        const pendingSuggestions = myPollIds.length > 0
            ? await communityDb.centralCommunityPollOption.findMany({
                where: { pollId: { in: myPollIds }, isApproved: false },
            })
            : [];

        const data = polls.map((p: any) => ({
            id: p.id,
            question: p.question,
            isOwn: p.email === info.email,
            creatorName: p.displayName || "Unknown",
            totalVotes: p._count.votes,
            myVoteOptionId: myVoteMap.get(p.id) ?? null,
            isPinned: p.isPinned,
            game: p.game,
            createdAt: p.createdAt.toISOString(),
            options: p.options.map((o: any) => ({
                id: o.id,
                text: o.text,
                votes: o._count.votes,
                addedBy: o.addedByEmail !== p.email ? o.addedByName : null,
            })),
            pendingSuggestions: p.email === info.email
                ? pendingSuggestions.filter((s: any) => s.pollId === p.id).map((s: any) => ({
                    id: s.id,
                    text: s.text,
                    suggestedBy: s.addedByName || "Unknown",
                }))
                : [],
        }));

        return SuccessResponse({ data });
    } catch (error) {
        console.error("Error fetching community polls:", error);
        return ErrorResponse({ message: "Failed to fetch polls" });
    }
}

/**
 * POST /api/community/polls — Create a new poll (central DB).
 */
export async function POST(req: Request) {
    try {
        const info = await getPlayerInfo();
        if (!info) return ErrorResponse({ message: "Unauthorized", status: 401 });

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

        const poll = await communityDb.centralCommunityPoll.create({
            data: {
                question: question.trim().slice(0, 200),
                email: info.email,
                displayName: info.displayName,
                game: GAME,
                options: {
                    create: options
                        .filter((o: string) => o.trim())
                        .map((o: string) => ({
                            text: o.trim().slice(0, 100),
                            addedByEmail: info.email,
                            addedByName: info.displayName,
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

/**
 * PATCH /api/community/polls — Vote, suggest, approve/reject, edit, delete, pin.
 */
export async function PATCH(req: Request) {
    try {
        const info = await getPlayerInfo();
        if (!info) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const body = await req.json();
        const { action } = body;

        // ── Vote on an option ──
        if (action === "vote") {
            const { pollId, optionId } = body;

            const option = await communityDb.centralCommunityPollOption.findFirst({
                where: { id: optionId, pollId, isApproved: true },
            });
            if (!option) return ErrorResponse({ message: "Invalid option", status: 400 });

            await communityDb.centralCommunityPollVote.upsert({
                where: { pollId_email: { pollId, email: info.email } },
                create: { pollId, optionId, email: info.email },
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

            const poll = await communityDb.centralCommunityPoll.findUnique({
                where: { id: pollId },
                select: { email: true, isActive: true },
            });
            if (!poll || !poll.isActive) {
                return ErrorResponse({ message: "Poll not found", status: 404 });
            }

            const isCreator = poll.email === info.email;

            await communityDb.centralCommunityPollOption.create({
                data: {
                    pollId,
                    text: text.trim().slice(0, 100),
                    addedByEmail: info.email,
                    addedByName: info.displayName,
                    isApproved: isCreator,
                },
            });

            return SuccessResponse({
                message: isCreator ? "Option added!" : "Suggestion sent for approval!",
            });
        }

        // ── Approve/reject suggestion ──
        if (action === "approve" || action === "reject") {
            const { optionId } = body;

            const option = await communityDb.centralCommunityPollOption.findUnique({
                where: { id: optionId },
                include: { poll: { select: { email: true } } },
            });

            if (!option) return ErrorResponse({ message: "Option not found", status: 404 });
            if (option.poll.email !== info.email) {
                return ErrorResponse({ message: "Only the poll creator can approve", status: 403 });
            }

            if (action === "approve") {
                await communityDb.centralCommunityPollOption.update({
                    where: { id: optionId },
                    data: { isApproved: true },
                });
                return SuccessResponse({ message: "Option approved!" });
            } else {
                await communityDb.centralCommunityPollOption.delete({
                    where: { id: optionId },
                });
                return SuccessResponse({ message: "Suggestion rejected" });
            }
        }

        // ── Close poll ──
        if (action === "close") {
            const { pollId } = body;
            const poll = await communityDb.centralCommunityPoll.findUnique({
                where: { id: pollId },
                select: { email: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            if (poll.email !== info.email) {
                return ErrorResponse({ message: "Only the creator can close", status: 403 });
            }

            await communityDb.centralCommunityPoll.update({
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
            const poll = await communityDb.centralCommunityPoll.findUnique({
                where: { id: pollId },
                select: { email: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            if (poll.email !== info.email) {
                return ErrorResponse({ message: "Only the creator can edit", status: 403 });
            }
            await communityDb.centralCommunityPoll.update({
                where: { id: pollId },
                data: { question: question.trim().slice(0, 200) },
            });
            return SuccessResponse({ message: "Poll updated!" });
        }

        // ── Delete poll ──
        if (action === "delete") {
            const { pollId } = body;
            const poll = await communityDb.centralCommunityPoll.findUnique({
                where: { id: pollId },
                select: { email: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            const user = await getCurrentUser();
            if (poll.email !== info.email && user?.role !== "SUPER_ADMIN") {
                return ErrorResponse({ message: "Not authorized", status: 403 });
            }
            await communityDb.centralCommunityPoll.delete({ where: { id: pollId } });
            return SuccessResponse({ message: "Poll deleted" });
        }

        // ── Pin/unpin poll (super admin only) ──
        if (action === "pin") {
            const user = await getCurrentUser();
            if (user?.role !== "SUPER_ADMIN") {
                return ErrorResponse({ message: "Only super admin can pin", status: 403 });
            }
            const { pollId } = body;
            const poll = await communityDb.centralCommunityPoll.findUnique({
                where: { id: pollId },
                select: { isPinned: true },
            });
            if (!poll) return ErrorResponse({ message: "Poll not found", status: 404 });
            await communityDb.centralCommunityPoll.update({
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
