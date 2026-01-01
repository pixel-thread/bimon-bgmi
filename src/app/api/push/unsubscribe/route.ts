import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// POST - Unsubscribe from push notifications
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const body = await req.json();
        const { endpoint } = body;

        if (!endpoint) {
            return ErrorResponse({
                message: "Endpoint is required",
                status: 400,
            });
        }

        // Delete the subscription
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                playerId, // Only delete if it belongs to this player
            },
        });

        return SuccessResponse({
            message: "Unsubscribed from push notifications",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
