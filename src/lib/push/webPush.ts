import webPush from "web-push";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured. Push notifications will not work.");
} else {
    webPush.setVapidDetails(
        "mailto:admin@bimon-bgmi.com", // Contact email for push service
        vapidPublicKey,
        vapidPrivateKey
    );
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
}

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPush(
    subscription: PushSubscriptionData,
    payload: PushPayload
): Promise<boolean> {
    try {
        await webPush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
            },
            JSON.stringify(payload)
        );
        return true;
    } catch (error: any) {
        // If subscription is expired or invalid, return false so it can be cleaned up
        if (error.statusCode === 404 || error.statusCode === 410) {
            console.log("Push subscription expired:", subscription.endpoint);
            return false;
        }
        console.error("Failed to send push notification:", error);
        return false;
    }
}

export { webPush };
