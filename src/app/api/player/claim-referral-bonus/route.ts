import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * POST /api/player/claim-referral-bonus
 * 
 * Claims pending referral bonus UC reward.
 * This is given to promoters when their referred player completes 5 tournaments.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get player with pending referral bonus
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
                pendingReferralBonus: true,
                pendingReferralMsg: true,
            },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        if (!player.pendingReferralBonus) {
            return ErrorResponse({ message: "No pending referral bonus to claim", status: 400 });
        }

        const amount = player.pendingReferralBonus;
        const message = player.pendingReferralMsg || "Referral bonus";

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

            // 3. Clear pending referral bonus
            await tx.player.update({
                where: { id: player.id },
                data: {
                    pendingReferralBonus: null,
                    pendingReferralMsg: null,
                },
            });
        });

        return SuccessResponse({
            message: `${amount} UC referral bonus claimed!`,
            data: { amount },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
