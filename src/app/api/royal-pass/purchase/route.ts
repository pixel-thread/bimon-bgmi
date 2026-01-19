import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

const RP_PRICE = 5; // UC cost for Royal Pass (when not free)
const FREE_RP_LIMIT = 5; // First 5 purchases are free

/**
 * Purchase Royal Pass with UC (or free if within first 5)
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
        const actualPrice = isFreeOffer ? 0 : RP_PRICE;

        // Get player's UC balance
        const uc = await prisma.uC.findUnique({
            where: { playerId },
        });

        const currentBalance = uc?.balance ?? 0;

        // Check balance if not free
        if (!isFreeOffer && currentBalance < RP_PRICE) {
            return ErrorResponse({
                message: `Not enough UC. You need ${RP_PRICE} UC but have ${currentBalance} UC.`,
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
                    data: { balance: { decrement: RP_PRICE } },
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
                    description: isFreeOffer
                        ? "🎁 Royal Pass (FREE Early Bird!)"
                        : "👑 Royal Pass Purchase (50% OFF!)",
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
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
