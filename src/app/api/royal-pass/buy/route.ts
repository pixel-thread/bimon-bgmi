import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

const RP_PRICE_DISCOUNTED = 10; // 50% off from 20 UC
const RP_PRICE_FULL = 20; // Full price when discount lost
const STREAK_THRESHOLD = 8; // Streak milestone for RP reward

/**
 * POST /api/royal-pass/buy
 * Self-purchase Royal Pass for the current season.
 * Price: 5 UC (50% off) if streak < 8, or 10 UC (full) if streak >= 8.
 */
export async function POST() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                player: {
                    select: {
                        id: true,
                        hasRoyalPass: true,
                        wallet: { select: { id: true, balance: true } },
                        streak: { select: { current: true } },
                    },
                },
            },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        if (user.player.hasRoyalPass) {
            return ErrorResponse({ message: "You already have Royal Pass!", status: 400 });
        }

        // Lost discount if streak already reached threshold
        const lostDiscount = (user.player.streak?.current ?? 0) >= STREAK_THRESHOLD;
        const rpPrice = lostDiscount ? RP_PRICE_FULL : RP_PRICE_DISCOUNTED;

        if (!user.player.wallet || user.player.wallet.balance < rpPrice) {
            return ErrorResponse({
                message: `Not enough UC. You need ${rpPrice} UC.`,
                status: 400,
            });
        }

        const currentSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true },
        });

        await prisma.$transaction(async (tx) => {
            // Deduct UC
            await tx.wallet.update({
                where: { id: user.player!.wallet!.id },
                data: { balance: { decrement: rpPrice } },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    playerId: user.player!.id,
                    amount: rpPrice,
                    type: "DEBIT",
                    description: lostDiscount ? "Royal Pass Purchase (full price)" : "Royal Pass Purchase (50% off)",
                },
            });

            // Create RoyalPass record
            await tx.royalPass.create({
                data: {
                    playerId: user.player!.id,
                    seasonId: currentSeason?.id,
                    amount: rpPrice,
                    displayValue: 20, // Original price
                    pricePaid: rpPrice,
                },
            });

            // Enable Royal Pass
            await tx.player.update({
                where: { id: user.player!.id },
                data: { hasRoyalPass: true },
            });
        });

        return SuccessResponse({
            message: "Royal Pass activated! 👑",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to purchase Royal Pass", error });
    }
}
