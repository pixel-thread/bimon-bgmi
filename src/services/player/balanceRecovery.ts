import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

/**
 * Clears trusted status when player's balance recovers above -30.
 * Trusted status is specifically for allowing deeper negative balance (-100 vs -30).
 * Admin must manually unban players.
 */
export async function clearPlayerStatusOnBalanceRecovery(
    playerId: string,
    currentBalance: number,
    tx: Prisma.TransactionClient
) {
    if (currentBalance > -30) {
        const player = await tx.player.findUnique({
            where: { id: playerId },
            select: { isTrusted: true },
        });

        if (!player) return;

        // Balance is > -30, clear trusted status (no longer needs extended credit)
        if (player.isTrusted) {
            await tx.player.update({
                where: { id: playerId },
                data: {
                    isTrusted: false
                },
            });
        }
    }
}

