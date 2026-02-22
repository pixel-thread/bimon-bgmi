import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/notifications/read-all
 * Marks all notifications as read for the current user.
 */
export async function POST() {
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

        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
        });

        return SuccessResponse({
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return ErrorResponse({ message: "Failed to mark as read" });
    }
}
