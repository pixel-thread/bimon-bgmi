import { prisma } from "@/src/lib/db/prisma";
import { sendPush, PushPayload } from "@/src/lib/push/webPush";

/**
 * Send push notification to a specific player
 * Automatically cleans up expired/invalid subscriptions
 */
export async function sendPushToPlayer(
    playerId: string,
    payload: PushPayload
): Promise<{
    sent: number;
    failed: number;
    cleaned: number;
}> {
    // Get all push subscriptions for this player
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { playerId },
    });

    if (subscriptions.length === 0) {
        return { sent: 0, failed: 0, cleaned: 0 };
    }

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            const success = await sendPush(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                },
                payload
            );

            return { subscription: sub, success };
        })
    );

    // Count results and collect failed subscriptions for cleanup
    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    results.forEach((result) => {
        if (result.status === "fulfilled") {
            if (result.value.success) {
                sent++;
            } else {
                failed++;
                expiredEndpoints.push(result.value.subscription.endpoint);
            }
        } else {
            failed++;
        }
    });

    // Clean up expired subscriptions
    let cleaned = 0;
    if (expiredEndpoints.length > 0) {
        const deleteResult = await prisma.pushSubscription.deleteMany({
            where: {
                endpoint: { in: expiredEndpoints },
            },
        });
        cleaned = deleteResult.count;
    }

    return { sent, failed, cleaned };
}
