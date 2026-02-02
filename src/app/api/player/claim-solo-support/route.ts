import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * POST /api/player/claim-solo-support
 * 
 * Claims pending solo support UC reward.
 * This is given to players who lost against solo winners.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get player with pending solo support
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
                pendingSoloSupport: true,
                pendingSoloSupportMsg: true,
            },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        if (!player.pendingSoloSupport) {
            return ErrorResponse({ message: "No pending solo support to claim", status: 400 });
        }

        const amount = player.pendingSoloSupport;
        const message = player.pendingSoloSupportMsg || "Solo winner support";

        // Execute claim in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Credit UC balance
            await tx.uC.upsert({
                where: { playerId: player.id },
                create: {
                    player: { connect: { id: player.id } },
                    user: { connect: { id: user.id } },
                    balance: amount,
                },
                update: { balance: { increment: amount } },
            });

            // 2. Create transaction record
            await tx.transaction.create({
                data: {
                    playerId: player.id,
                    amount: amount,
                    type: "credit",
                    description: message,
                },
            });

            // 3. Clear pending solo support
            await tx.player.update({
                where: { id: player.id },
                data: {
                    pendingSoloSupport: null,
                    pendingSoloSupportMsg: null,
                },
            });
        });

        return SuccessResponse({
            message: `${amount} UC solo support claimed!`,
            data: { amount },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
