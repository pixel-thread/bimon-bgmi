import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

const CATEGORIES = ["feedback", "suggestion", "bug", "appreciation", "other"];

/**
 * GET /api/community
 * Admin: list all messages (with player info for non-anonymous, hidden for anonymous).
 * Player: list all messages (community feed) + own messages.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
        const playerId = user.player?.id;
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const mine = searchParams.get("mine") === "true";

        const where = mine && playerId
            ? { playerId }
            : isAdmin && unreadOnly
                ? { isRead: false }
                : {};

        const messages = await prisma.communityMessage.findMany({
            where,
            include: {
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        customProfileImageUrl: true,
                        user: { select: { username: true, imageUrl: true } },
                    },
                },
                votes: playerId ? {
                    where: { playerId },
                    select: { vote: true },
                } : false,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        // Transform: hide player info for anonymous messages (unless admin)
        const data = messages.map((m) => ({
            id: m.id,
            message: m.message,
            category: m.category,
            isAnonymous: m.isAnonymous,
            isRead: m.isRead,
            adminReply: m.adminReply,
            upvotes: m.upvotes,
            downvotes: m.downvotes,
            createdAt: m.createdAt,
            isOwn: playerId === m.playerId,
            myVote: Array.isArray(m.votes) && m.votes.length > 0 ? m.votes[0].vote : null,
            player: m.isAnonymous && !isAdmin
                ? null
                : {
                    displayName: m.player.displayName || m.player.user?.username || "Unknown",
                    imageUrl: m.player.customProfileImageUrl || m.player.user?.imageUrl || "",
                },
        }));

        const unreadCount = isAdmin
            ? await prisma.communityMessage.count({ where: { isRead: false } })
            : 0;

        return NextResponse.json({ success: true, data: { messages: data, unreadCount } });
    } catch (error) {
        console.error("Community GET error:", error);
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }
}

/**
 * POST /api/community
 * Player sends a message to the org. Can be anonymous.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.player?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { message, category = "feedback", isAnonymous = false } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }
        if (message.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
        }
        if (!CATEGORIES.includes(category)) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        // Rate limit: max 5 messages per day per player
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await prisma.communityMessage.count({
            where: { playerId: user.player.id, createdAt: { gte: today } },
        });
        if (todayCount >= 5) {
            return NextResponse.json({ error: "You can send max 5 messages per day" }, { status: 429 });
        }

        await prisma.communityMessage.create({
            data: {
                message: message.trim(),
                category,
                isAnonymous: !!isAnonymous,
                playerId: user.player.id,
            },
        });

        return NextResponse.json({ success: true, message: "Message sent! Thank you for your feedback 🙏" });
    } catch (error) {
        console.error("Community POST error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}

/**
 * PATCH /api/community
 * Admin: mark as read / reply.
 * Player: vote (upvote/downvote).
 */
export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

        // Vote action (any player)
        if (body.action === "vote") {
            if (!user.player?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            const { messageId, vote } = body; // vote: 1 or -1
            if (!messageId || (vote !== 1 && vote !== -1)) {
                return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
            }

            // Check if already voted
            const existing = await prisma.communityVote.findUnique({
                where: { messageId_playerId: { messageId, playerId: user.player.id } },
            });

            if (existing) {
                if (existing.vote === vote) {
                    // Same vote → remove it (toggle off)
                    await prisma.$transaction([
                        prisma.communityVote.delete({ where: { id: existing.id } }),
                        prisma.communityMessage.update({
                            where: { id: messageId },
                            data: vote === 1 ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
                        }),
                    ]);
                    return NextResponse.json({ success: true, action: "removed" });
                } else {
                    // Different vote → switch
                    await prisma.$transaction([
                        prisma.communityVote.update({ where: { id: existing.id }, data: { vote } }),
                        prisma.communityMessage.update({
                            where: { id: messageId },
                            data: vote === 1
                                ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                                : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
                        }),
                    ]);
                    return NextResponse.json({ success: true, action: "switched" });
                }
            } else {
                // New vote
                await prisma.$transaction([
                    prisma.communityVote.create({ data: { messageId, playerId: user.player.id, vote } }),
                    prisma.communityMessage.update({
                        where: { id: messageId },
                        data: vote === 1 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
                    }),
                ]);
                return NextResponse.json({ success: true, action: "voted" });
            }
        }

        // Admin actions
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        const { id, isRead, adminReply } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        const updateData: Record<string, unknown> = {};
        if (isRead !== undefined) updateData.isRead = isRead;
        if (adminReply !== undefined) updateData.adminReply = adminReply;

        await prisma.communityMessage.update({ where: { id }, data: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Community PATCH error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/**
 * DELETE /api/community
 * Admin: delete a message.
 */
export async function DELETE(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        await prisma.communityMessage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Community DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
