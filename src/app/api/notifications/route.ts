import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// GET - Get user's notifications
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Only show notifications from the last 7 days
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const notifications = await prisma.notification.findMany({
            where: {
                playerId,
                createdAt: { gte: oneWeekAgo }
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                playerId,
                isRead: false,
                createdAt: { gte: oneWeekAgo }
            },
        });

        return SuccessResponse({
            data: { notifications, unreadCount },
            message: "Notifications fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
