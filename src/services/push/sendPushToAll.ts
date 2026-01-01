import { prisma } from "@/src/lib/db/prisma";
import { sendPush, PushPayload } from "@/src/lib/push/webPush";

interface PushSubscriptionRecord {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    playerId: string;
}

/**
 * Send push notification to all subscribed players
 * Automatically cleans up expired/invalid subscriptions
 */
export async function sendPushToAllPlayers(payload: PushPayload): Promise<{
    sent: number;
    failed: number;
    cleaned: number;
}> {
    // Get all push subscriptions
    const subscriptions: PushSubscriptionRecord[] = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
        return { sent: 0, failed: 0, cleaned: 0 };
    }

    const results = await Promise.allSettled(
        subscriptions.map(async (sub: PushSubscriptionRecord) => {
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

    results.forEach((result: PromiseSettledResult<{ subscription: PushSubscriptionRecord; success: boolean }>) => {
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
