import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { GAME } from "@/lib/game-config";
import { type NextRequest } from "next/server";
import Razorpay from "razorpay";
import { creditWallet, getEmailByPlayerId } from "@/lib/wallet-service";

// Razorpay platform fee (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/payments/check-pending
 * Checks for any "created" payments belonging to the current user
 * and attempts to verify/recover them by querying Razorpay directly.
 *
 * This catches the common case where a mobile UPI payment succeeds
 * but the client-side handler callback never fires (e.g., app switch,
 * page reload, or network interruption).
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthEmail();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findFirst({
            where: userWhereEmail(userId),
            select: { id: true, player: { select: { id: true } } },
        });

        if (!user?.player) {
            return SuccessResponse({ data: { recovered: 0 }, cache: CACHE.NONE });
        }

        // Find payments stuck at "created" (last 24 hours only)
        const pendingPayments = await prisma.payment.findMany({
            where: {
                playerId: user.player.id,
                status: "created",
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: "desc" },
            take: 5, // Limit to avoid excessive API calls
        });

        if (pendingPayments.length === 0) {
            return SuccessResponse({ data: { recovered: 0 }, cache: CACHE.NONE });
        }

        console.log(`[Payment Recovery] Found ${pendingPayments.length} pending payments for player=${user.player.id}`);

        let recovered = 0;

        for (const payment of pendingPayments) {
            try {
                // Query Razorpay for the order status
                const order = await razorpay.orders.fetch(payment.razorpayOrderId);

                if (order.status !== "paid") {
                    console.log(`[Payment Recovery] Order ${payment.razorpayOrderId} status=${order.status} — skipping`);
                    continue;
                }

                // Order was paid at Razorpay! Fetch the payment details
                const payments = await razorpay.orders.fetchPayments(payment.razorpayOrderId);
                const capturedPayment = (payments as any).items?.find(
                    (p: any) => p.status === "captured"
                );

                if (!capturedPayment) {
                    console.log(`[Payment Recovery] No captured payment for order ${payment.razorpayOrderId}`);
                    continue;
                }

                // Calculate UC
                const amountInRupees = payment.amount / 100;
                const ucAmount = Math.floor(
                    amountInRupees * (1 - PLATFORM_FEE_PERCENT / 100)
                );

                // Credit wallet
                const playerEmail = await getEmailByPlayerId(payment.playerId);
                if (!playerEmail) {
                    console.error(`[Payment Recovery] No email for player=${payment.playerId}`);
                    continue;
                }

                const description = `Added ${ucAmount} ${GAME.currency} via Razorpay`;
                await creditWallet(playerEmail, ucAmount, description, "TOP_UP");

                // Mark as paid
                await prisma.payment.update({
                    where: { razorpayOrderId: payment.razorpayOrderId },
                    data: {
                        razorpayPaymentId: capturedPayment.id,
                        status: "paid",
                    },
                });

                console.log(`[Payment Recovery] ✅ Recovered ${ucAmount} UC for player=${payment.playerId}, order=${payment.razorpayOrderId}`);
                recovered++;
            } catch (orderError) {
                console.error(`[Payment Recovery] Error checking order ${payment.razorpayOrderId}:`, orderError);
            }
        }

        return SuccessResponse({
            data: { recovered },
            message: recovered > 0
                ? `Recovered ${recovered} pending payment(s)!`
                : "No pending payments to recover",
            cache: CACHE.NONE,
        });
    } catch (error) {
        console.error("[Payment Recovery] EXCEPTION:", error);
        return ErrorResponse({
            message: "Failed to check pending payments",
            error,
        });
    }
}
