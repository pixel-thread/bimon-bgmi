import { NextRequest, NextResponse } from "next/server";
import { walletDb } from "@/lib/wallet-db";
import { getCurrentUser } from "@/lib/auth";

const CATEGORIES = ["feedback", "suggestion", "bug", "appreciation", "other"];
const GAME = process.env.NEXT_PUBLIC_GAME_MODE || "bgmi";

/**
 * GET /api/community
 * Returns all community messages from the central DB (shared across all games).
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const email = user.email;
        const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const mine = searchParams.get("mine") === "true";

        const where = mine && email
            ? { email }
            : isAdmin && unreadOnly
                ? { isRead: false }
                : {};

        const messages = await walletDb.centralCommunityMessage.findMany({
            where,
            include: {
                votes: email ? {
                    where: { email },
                    select: { vote: true },
                } : false,
            },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            take: 100,
        });

        const data = messages.map((m: any) => ({
            id: m.id,
            message: m.message,
            category: m.category,
            isAnonymous: m.isAnonymous,
            isRead: m.isRead,
            adminReply: m.adminReply,
            upvotes: m.upvotes,
            downvotes: m.downvotes,
            createdAt: m.createdAt,
            isOwn: email === m.email,
            isPinned: m.isPinned,
            game: m.game,
            myVote: Array.isArray(m.votes) && m.votes.length > 0 ? m.votes[0].vote : null,
            player: m.isAnonymous && !isAdmin
                ? null
                : {
                    displayName: m.displayName || "Unknown",
                    imageUrl: m.imageUrl || "",
                },
        }));

        const unreadCount = isAdmin
            ? await walletDb.centralCommunityMessage.count({ where: { isRead: false } })
            : 0;

        return NextResponse.json({ success: true, data: { messages: data, unreadCount } });
    } catch (error) {
        console.error("Community GET error:", error);
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }
}

/**
 * POST /api/community
 * Player sends a message. Stored in central DB with game origin tag.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.player?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const email = user.email;
        if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });

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

        // Rate limit: max 5 messages per day per email
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await walletDb.centralCommunityMessage.count({
            where: { email, createdAt: { gte: today } },
        });
        if (todayCount >= 5) {
            return NextResponse.json({ error: "You can send max 5 messages per day" }, { status: 429 });
        }

        // Get display name and image for caching
        const displayName = user.player.displayName || user.username || "Unknown";
        const imageUrl = user.imageUrl || "";

        await walletDb.centralCommunityMessage.create({
            data: {
                message: message.trim(),
                category,
                isAnonymous: !!isAnonymous,
                email,
                displayName,
                imageUrl,
                game: GAME,
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
 * Vote, edit, delete, pin messages — all via central DB.
 */
export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
        const email = user.email;

        // Vote action (any player)
        if (body.action === "vote") {
            if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            const { messageId, vote } = body;
            if (!messageId || (vote !== 1 && vote !== -1)) {
                return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
            }

            const existing = await walletDb.centralCommunityVote.findUnique({
                where: { messageId_email: { messageId, email } },
            });

            if (existing) {
                if (existing.vote === vote) {
                    // Same vote → toggle off
                    await walletDb.$transaction([
                        walletDb.centralCommunityVote.delete({ where: { id: existing.id } }),
                        walletDb.centralCommunityMessage.update({
                            where: { id: messageId },
                            data: vote === 1 ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
                        }),
                    ]);
                    return NextResponse.json({ success: true, action: "removed" });
                } else {
                    // Switch vote
                    await walletDb.$transaction([
                        walletDb.centralCommunityVote.update({ where: { id: existing.id }, data: { vote } }),
                        walletDb.centralCommunityMessage.update({
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
                await walletDb.$transaction([
                    walletDb.centralCommunityVote.create({ data: { messageId, email, vote } }),
                    walletDb.centralCommunityMessage.update({
                        where: { id: messageId },
                        data: vote === 1 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
                    }),
                ]);
                return NextResponse.json({ success: true, action: "voted" });
            }
        }

        // Edit own message
        if (body.action === "edit") {
            if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            const { messageId, message: newMessage } = body;
            if (!messageId || !newMessage?.trim()) {
                return NextResponse.json({ error: "Message required" }, { status: 400 });
            }
            const msg = await walletDb.centralCommunityMessage.findUnique({ where: { id: messageId } });
            if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
            if (msg.email !== email) {
                return NextResponse.json({ error: "Not your message" }, { status: 403 });
            }
            await walletDb.centralCommunityMessage.update({
                where: { id: messageId },
                data: { message: newMessage.trim().slice(0, 500) },
            });
            return NextResponse.json({ success: true, message: "Message updated!" });
        }

        // Delete own message (or admin)
        if (body.action === "delete") {
            if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            const { messageId } = body;
            const msg = await walletDb.centralCommunityMessage.findUnique({ where: { id: messageId } });
            if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
            if (msg.email !== email && !isAdmin) {
                return NextResponse.json({ error: "Not your message" }, { status: 403 });
            }
            await walletDb.centralCommunityMessage.delete({ where: { id: messageId } });
            return NextResponse.json({ success: true, message: "Message deleted" });
        }

        // Pin/unpin (super admin only)
        if (body.action === "pin") {
            if (user.role !== "SUPER_ADMIN") {
                return NextResponse.json({ error: "Only super admin can pin" }, { status: 403 });
            }
            const { messageId } = body;
            const msg = await walletDb.centralCommunityMessage.findUnique({ where: { id: messageId } });
            if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
            await walletDb.centralCommunityMessage.update({
                where: { id: messageId },
                data: { isPinned: !msg.isPinned },
            });
            return NextResponse.json({ success: true, message: msg.isPinned ? "Unpinned" : "Pinned!" });
        }

        // Admin: mark as read / reply
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        const { id, isRead, adminReply } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        const updateData: Record<string, unknown> = {};
        if (isRead !== undefined) updateData.isRead = isRead;
        if (adminReply !== undefined) updateData.adminReply = adminReply;

        await walletDb.centralCommunityMessage.update({ where: { id }, data: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Community PATCH error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/**
 * DELETE /api/community — Admin delete.
 */
export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        await walletDb.centralCommunityMessage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Community DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
