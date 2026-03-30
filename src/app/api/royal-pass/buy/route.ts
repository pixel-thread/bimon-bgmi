import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { GAME } from "@/lib/game-config";
import { getAvailableBalance, debitWallet } from "@/lib/wallet-service";

/**
 * POST /api/royal-pass/buy
 * Self-purchase Royal Pass for the current season.
 * Price: 5 UC (75% off) if streak < 8, or 20 UC (full) if streak >= 8.
 * If paying full price (streak >= 8), also grants 30 UC streak reward and resets streak to 0.
 */
export async function POST() {
    try {
        const email = await getAuthEmail();
        if (!email) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const settings = await getSettings();
        if (!settings.enableElitePass) {
            return ErrorResponse({ message: `${GAME.passName} is currently disabled`, status: 403 });
        }
        const RP_PRICE_DISCOUNTED = settings.elitePassPrice;
        const RP_PRICE_FULL = settings.elitePassOrigPrice;
        const STREAK_THRESHOLD = settings.streakMilestone;
        const STREAK_REWARD_UC = settings.streakRewardAmount;

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                player: {
                    select: {
                        id: true,
                        hasRoyalPass: true,
                        wallet: { select: { id: true, balance: true } },
                        streak: { select: { current: true, longest: true } },
                    },
                },
            },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        if (user.player.hasRoyalPass) {
            return ErrorResponse({ message: `You already have ${GAME.passName}!`, status: 400 });
        }

        // Lost discount if streak already reached threshold
        const currentStreak = user.player.streak?.current ?? 0;
        const lostDiscount = currentStreak >= STREAK_THRESHOLD;
        const rpPrice = lostDiscount ? RP_PRICE_FULL : RP_PRICE_DISCOUNTED;

        const { available, reserved } = await getAvailableBalance(email);
        if (available < rpPrice) {
            const reservedNote = reserved > 0 ? ` (${reserved} ${GAME.currency} reserved)` : "";
            return ErrorResponse({
                message: `Not enough ${GAME.currency}. You need ${rpPrice} ${GAME.currency} but have ${available} available${reservedNote}.`,
                status: 400,
            });
        }

        const currentSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true },
        });

        // Debit central wallet
        const description = lostDiscount ? `${GAME.passName} Purchase (full price)` : `${GAME.passName} Purchase (75% off)`;
        const walletResult = await debitWallet(email, rpPrice, description, "ROYAL_PASS_PURCHASE");

        await prisma.$transaction(async (tx) => {

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

            // If paying full price (streak >= 8), grant streak reward + reset streak
            if (lostDiscount) {
                // Create streak reward
                await tx.pendingReward.create({
                    data: {
                        playerId: user.player!.id,
                        type: "STREAK",
                        amount: STREAK_REWARD_UC,
                        message: `🔥 ${STREAK_THRESHOLD} tournament streak reward!`,
                    },
                });

                // Reset streak to 0, preserve longest
                const newLongest = Math.max(currentStreak, user.player!.streak?.longest ?? 0);
                await tx.playerStreak.update({
                    where: { playerId: user.player!.id },
                    data: {
                        current: 0,
                        longest: newLongest,
                        lastRewardAt: new Date(),
                    },
                });
            }
        });

        return SuccessResponse({
            message: lostDiscount
                ? `${GAME.passName} activated! ${GAME.passEmoji} + 🔥 ${STREAK_REWARD_UC} ${GAME.currency} streak reward created!`
                : `${GAME.passName} activated! ${GAME.passEmoji}`,
        });
    } catch (error) {
        return ErrorResponse({ message: `Failed to purchase ${GAME.passName}`, error });
    }
}
