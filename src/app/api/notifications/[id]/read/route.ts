import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// PATCH - Mark notification as read
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId || user?.player?.id;
        const notificationId = (await params).id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            return ErrorResponse({ message: "Notification not found", status: 404 });
        }

        if (notification.playerId !== playerId) {
            return ErrorResponse({ message: "Not authorized", status: 403 });
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        return SuccessResponse({
            data: updated,
            message: "Notification marked as read",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
