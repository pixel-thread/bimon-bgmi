import type { PrismaClient } from "@prisma/client";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Auto-clears trusted status when a player's balance recovers above -30 UC.
 * Trusted status is specifically for allowing deeper negative balance (-200 vs -29).
 * Once they're no longer in deep debt, the extended credit line resets.
 *
 * Ported from v1's balanceRecovery.ts
 */
export async function clearTrustedOnBalanceRecovery(
    playerId: string,
    currentBalance: number,
    tx: TransactionClient
) {
    if (currentBalance > -30) {
        const player = await tx.player.findUnique({
            where: { id: playerId },
            select: { isTrusted: true },
        });

        if (!player?.isTrusted) return;

        // Balance recovered above -30 → clear trusted (no longer needs extended credit)
        await tx.player.update({
            where: { id: playerId },
            data: { isTrusted: false },
        });
    }
}
