import { sendPushToPlayer } from "./sendPushToPlayer";

// Batch configuration for performance
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100; // Small delay between batches to avoid overwhelming

/**
 * Helper to process notifications in batches with throttling
 */
async function processBatchedNotifications<T>(
    items: T[],
    processor: (item: T) => Promise<void>
): Promise<void> {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);

        // Process batch in parallel
        await Promise.allSettled(batch.map(processor));

        // Small delay between batches if more remain
        if (i + BATCH_SIZE < items.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }
}

/**
 * Send push notification for UC received (prize, support, etc.)
 */
export async function notifyUCReceived(
    playerId: string,
    amount: number,
    source: string
): Promise<void> {
    await sendPushToPlayer(playerId, {
        title: `+₹${amount} UC`,
        body: source,
        url: "/profile",
    });
}

/**
 * Send push notification for UC added by admin
 */
export async function notifyUCAdded(
    playerId: string,
    amount: number,
    reason?: string
): Promise<void> {
    await sendPushToPlayer(playerId, {
        title: `+₹${amount} UC`,
        body: reason || "UC added to your wallet",
        url: "/profile",
    });
}

/**
 * Send push notification for tournament entry fee
 */
export async function notifyTournamentEntry(
    playerId: string,
    amount: number,
    tournamentName: string
): Promise<void> {
    await sendPushToPlayer(playerId, {
        title: `-₹${amount} UC`,
        body: `Entry fee for ${tournamentName}`,
        url: "/tournament/teams",
    });
}

/**
 * Batch notify multiple players about UC received
 * Optimized for large tournaments with throttling
 */
export async function batchNotifyUCReceived(
    notifications: Array<{
        playerId: string;
        amount: number;
        source: string;
    }>
): Promise<void> {
    await processBatchedNotifications(notifications, async (n) => {
        await notifyUCReceived(n.playerId, n.amount, n.source);
    });
}

/**
 * Batch notify multiple players about tournament entry
 * Optimized for large tournaments with throttling
 */
export async function batchNotifyTournamentEntry(
    notifications: Array<{
        playerId: string;
        amount: number;
        tournamentName: string;
    }>
): Promise<void> {
    await processBatchedNotifications(notifications, async (n) => {
        await notifyTournamentEntry(n.playerId, n.amount, n.tournamentName);
    });
}

/**
 * Fire and forget batch notifications in background
 * Use this when you don't want to await the notifications
 */
export function fireAndForgetBatchNotify(
    notifications: Array<{
        playerId: string;
        amount: number;
        source: string;
    }>
): void {
    // Run in background, don't block
    batchNotifyUCReceived(notifications)
        .catch(err => console.error("Batch notify failed:", err));
}
