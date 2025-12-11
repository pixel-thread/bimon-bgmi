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

        const notifications = await prisma.notification.findMany({
            where: { playerId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { playerId, isRead: false },
        });

        return SuccessResponse({
            data: { notifications, unreadCount },
            message: "Notifications fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
