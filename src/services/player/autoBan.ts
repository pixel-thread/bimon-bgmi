import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export async function checkAndApplyAutoBan(
    playerId: string,
    currentBalance: number,
    tx: Prisma.TransactionClient
) {
    const player = await tx.player.findUnique({
        where: { id: playerId },
        select: { isBanned: true, manualUnban: true, isTrusted: true },
    });

    if (!player) return;

    if (currentBalance <= -30) {
        // Should be banned unless manually unbanned
        if (!player.isBanned && !player.manualUnban) {
            await tx.player.update({
                where: { id: playerId },
                data: { isBanned: true },
            });

            // Create a notification for the ban
            await tx.notification.create({
                data: {
                    title: "Account Banned",
                    message: "Bann lah se?",
                    type: "ban",
                    playerId: playerId,
                }
            });
        }
    } else {
        // Balance is > -30, should be unbanned, manual override reset, and trusted status removed
        if (player.isBanned || player.manualUnban || player.isTrusted) {
            await tx.player.update({
                where: { id: playerId },
                data: {
                    isBanned: false,
                    manualUnban: false,
                    isTrusted: false
                },
            });
        }
    }
}
