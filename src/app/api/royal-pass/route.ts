import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { RP_PRICE } from "@/src/lib/royal-pass/config";

/**
 * GET /api/royal-pass - Get current user's Royal Pass status for active season
 */
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get player from user
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
        });

        if (!activeSeason) {
            return SuccessResponse({
                data: {
                    hasRoyalPass: false,
                    rpPrice: RP_PRICE,
                    benefitType: "SAFETY_NET",
                    seasonName: null,
                    expiresAt: null,
                    message: "No active season",
                },
            });
        }

        // Check if player has active Royal Pass for current season
        const royalPass = await prisma.royalPass.findUnique({
            where: {
                playerId_seasonId: {
                    playerId: player.id,
                    seasonId: activeSeason.id,
                },
            },
        });

        // Get total RP Safety Net refunds earned this season (for subscribed users)
        let totalBonusEarned = 0;
        if (royalPass) {
            // Count transactions that include "RP Safety Net" in description
            const bonusTransactions = await prisma.transaction.findMany({
                where: {
                    playerId: player.id,
                    description: { contains: "RP Safety Net" },
                    timestamp: { gte: activeSeason.startDate },
                },
            });
            totalBonusEarned = bonusTransactions.reduce((sum, t) => sum + t.amount, 0);
        }

        // Get player's UC balance
        const uc = await prisma.uC.findUnique({
            where: { playerId: player.id },
        });

        return SuccessResponse({
            data: {
                hasRoyalPass: !!royalPass,
                isActive: royalPass?.isActive ?? false,
                rpPrice: RP_PRICE,
                benefitType: "SAFETY_NET",
                seasonName: activeSeason.name,
                seasonEndDate: activeSeason.endDate,
                expiresAt: royalPass?.expiresAt ?? null,
                totalBonusEarned,
                currentBalance: uc?.balance ?? 0,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

/**
 * POST /api/royal-pass - Subscribe to Royal Pass for current season
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get player from user
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
            include: { uc: true },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
        });

        if (!activeSeason) {
            return ErrorResponse({ message: "No active season", status: 400 });
        }

        // Check if already subscribed
        const existingRP = await prisma.royalPass.findUnique({
            where: {
                playerId_seasonId: {
                    playerId: player.id,
                    seasonId: activeSeason.id,
                },
            },
        });

        if (existingRP) {
            return ErrorResponse({
                message: "You already have Royal Pass for this season",
                status: 400,
            });
        }

        // Check balance
        const currentBalance = player.uc?.balance ?? 0;
        if (currentBalance < RP_PRICE) {
            return ErrorResponse({
                message: `Insufficient balance. You need ${RP_PRICE} UC but have ${currentBalance} UC.`,
                status: 400,
            });
        }

        // Deduct UC and create Royal Pass in transaction
        await prisma.$transaction([
            // Deduct UC
            prisma.uC.update({
                where: { playerId: player.id },
                data: { balance: { decrement: RP_PRICE } },
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    playerId: player.id,
                    amount: -RP_PRICE,
                    type: "debit",
                    description: `Royal Pass - ${activeSeason.name}`,
                },
            }),
            // Create Royal Pass subscription
            // expiresAt is null for active seasons (no end date yet)
            prisma.royalPass.create({
                data: {
                    playerId: player.id,
                    seasonId: activeSeason.id,
                    isActive: true,
                    expiresAt: activeSeason.endDate ?? undefined,
                },
            }),
        ]);

        return SuccessResponse({
            message: "👑 Royal Pass activated! 3rd place finishes now get entry fee back!",
            data: {
                hasRoyalPass: true,
                seasonName: activeSeason.name,
                expiresAt: activeSeason.endDate,
                benefitType: "SAFETY_NET",
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
