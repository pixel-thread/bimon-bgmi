import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { z } from "zod";

const subscribeSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

/**
 * POST /api/push/subscribe
 * Save a push subscription for the current player.
 */
export async function POST(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const { endpoint, keys } = subscribeSchema.parse(body);

        const user = await prisma.user.findFirst({
            where: userWhereEmail(email),
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Upsert — same endpoint = update keys, new endpoint = create
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: {
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                playerId: user.player.id,
            },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
                playerId: user.player.id,
            },
        });

        return SuccessResponse({
            message: "Push subscription saved",
            cache: CACHE.NONE,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to save push subscription",
            error,
        });
    }
}

/**
 * DELETE /api/push/subscribe
 * Remove a push subscription (user opted out).
 */
export async function DELETE(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const { endpoint } = z.object({ endpoint: z.string() }).parse(body);

        await prisma.pushSubscription.deleteMany({
            where: { endpoint },
        });

        return SuccessResponse({
            message: "Push subscription removed",
            cache: CACHE.NONE,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to remove push subscription",
            error,
        });
    }
}
