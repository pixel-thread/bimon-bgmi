import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// POST - Subscribe to push notifications
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const body = await req.json();
        const { endpoint, keys } = body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return ErrorResponse({
                message: "Invalid subscription data",
                status: 400,
            });
        }

        // Upsert the subscription (update if endpoint exists, create if not)
        const subscription = await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
                playerId, // Update player association if changed
            },
            create: {
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                playerId,
            },
        });

        return SuccessResponse({
            data: { id: subscription.id },
            message: "Subscribed to push notifications",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
