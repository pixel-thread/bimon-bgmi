import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { STREAK_REWARD_THRESHOLD, getPlayerStreakInfo } from "@/src/services/player/tournamentStreak";

const RP_PRICE_DISCOUNTED = 5; // UC cost with 50% discount
const RP_PRICE_FULL = 10; // Full UC cost (no discount)
const FREE_RP_LIMIT = 5; // First 5 purchases are free

/**
 * Purchase Royal Pass with UC (or free if within first 5)
 * Players with streak >= 8 who don't have RP lose the discount and pay full price
 */
export async function POST(req: NextRequest) {
    try {
        const { playerId } = await tokenMiddleware(req);

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Check if already has RP
        const existingRP = await prisma.royalPass.findFirst({
            where: { playerId },
        });

        if (existingRP) {
            return ErrorResponse({ message: "You already have Royal Pass!", status: 400 });
        }

        // Count total RP claimed to check if free offer applies
        const totalRPClaimed = await prisma.royalPass.count();
        const isFreeOffer = totalRPClaimed < FREE_RP_LIMIT;

        // Check if player lost discount (streak >= 8 without RP)
        const streakInfo = await getPlayerStreakInfo(playerId);
        const lostDiscount = streakInfo.currentStreak >= STREAK_REWARD_THRESHOLD;

        // Determine actual price
        let actualPrice: number;
        let priceMessage: string;

        if (isFreeOffer) {
            actualPrice = 0;
            priceMessage = "🎁 Royal Pass (FREE Early Bird!)";
        } else if (lostDiscount) {
            actualPrice = RP_PRICE_FULL;
            priceMessage = "👑 Royal Pass Purchase";
        } else {
            actualPrice = RP_PRICE_DISCOUNTED;
            priceMessage = "👑 Royal Pass Purchase (50% OFF!)";
        }

        // Get player's UC balance
        const uc = await prisma.uC.findUnique({
            where: { playerId },
        });

        const currentBalance = uc?.balance ?? 0;

        // Check balance if not free
        if (!isFreeOffer && currentBalance < actualPrice) {
            return ErrorResponse({
                message: `Not enough UC. You need ${actualPrice} UC but have ${currentBalance} UC.`,
                status: 400,
            });
        }

        // Perform the purchase transaction
        const operations = [];

        // Deduct UC only if not free
        if (!isFreeOffer) {
            operations.push(
                prisma.uC.update({
                    where: { playerId },
                    data: { balance: { decrement: actualPrice } },
                })
            );
        }

        // Create Royal Pass record
        operations.push(
            prisma.royalPass.create({
                data: {
                    playerId,
                    amount: actualPrice,
                    displayValue: 10, // Worth 10 UC
                    pricePaid: actualPrice * 100, // In paisa equivalent
                },
            })
        );

        // Create transaction record
        operations.push(
            prisma.transaction.create({
                data: {
                    playerId,
                    amount: actualPrice,
                    type: "debit",
                    description: priceMessage,
                },
            })
        );

        await prisma.$transaction(operations);

        return SuccessResponse({
            message: isFreeOffer
                ? `🎉 Royal Pass claimed FREE! (${totalRPClaimed + 1}/${FREE_RP_LIMIT})`
                : "🎉 Royal Pass purchased successfully!",
            data: {
                ucSpent: actualPrice,
                newBalance: currentBalance - actualPrice,
                wasFree: isFreeOffer,
                lostDiscount,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

