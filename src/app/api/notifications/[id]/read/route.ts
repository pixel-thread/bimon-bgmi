import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * POST /api/notifications/[id]/read
 * Marks a single notification as read.
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { id } = await params;

        await prisma.notification.updateMany({
            where: {
                id,
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        return SuccessResponse({ message: "Marked as read" });
    } catch (error) {
        return ErrorResponse({ message: "Failed to mark as read", error });
    }
}
