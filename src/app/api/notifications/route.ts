import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/notifications
 * Fetches the current user's notifications from the last 7 days + unread count + pending UC requests.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, player: { select: { id: true } } },
        });

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [notifications, unreadCount, pendingRequests] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    userId: user.id,
                    createdAt: { gte: oneWeekAgo },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            }),
            prisma.notification.count({
                where: {
                    userId: user.id,
                    isRead: false,
                    createdAt: { gte: oneWeekAgo },
                },
            }),
            // Fetch pending UC requests where this player is the recipient (toPlayer)
            user.player
                ? prisma.uCTransfer.findMany({
                    where: {
                        toPlayerId: user.player.id,
                        type: "REQUEST",
                        status: "PENDING",
                    },
                    include: {
                        fromPlayer: {
                            select: {
                                id: true,
                                displayName: true,
                                wallet: { select: { balance: true } },
                                user: { select: { username: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                })
                : [],
        ]);

        return SuccessResponse({
            data: { notifications, unreadCount, pendingRequests },
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return ErrorResponse({ message: "Failed to fetch notifications" });
    }
}
