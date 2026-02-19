import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/notifications
 * Fetches notifications for the current user.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const data = notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
            isRead: n.isRead,
            createdAt: n.createdAt,
        }));

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch notifications",
            error,
        });
    }
}
