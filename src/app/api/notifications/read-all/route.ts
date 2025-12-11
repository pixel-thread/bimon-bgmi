import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// POST - Mark all notifications as read
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        await prisma.notification.updateMany({
            where: { playerId, isRead: false },
            data: { isRead: true },
        });

        return SuccessResponse({
            message: "All notifications marked as read",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
