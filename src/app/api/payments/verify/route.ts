import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { GAME, getGameConfig } from "@/lib/game-config";
import { type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { creditWallet, getEmailByPlayerId } from "@/lib/wallet-service";

// Razorpay platform fee (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;

const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and credits UC to player wallet.
 * UC = rupees paid minus 2.4% Razorpay fee.
 */
export async function POST(req: NextRequest) {
    try {
        // Guard: Razorpay payments are only enabled for BGMI
        const { GAME: reqGame } = getGameConfig(req);
        if (!reqGame.features.hasTopUps) {
            console.error(`[Payment Verify] Blocked — game ${reqGame.mode} does not support top-ups`);
            return ErrorResponse({ message: "Payments not available for this game", status: 403 });
        }

        const userId = await getAuthEmail();
        if (!userId) {
            console.error("[Payment Verify] Unauthorized — no session");
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            verifyPaymentSchema.parse(body);

        console.log(`[Payment Verify] Processing order=${razorpay_order_id}, payment=${razorpay_payment_id}, user=${userId}`);

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error(`[Payment Verify] Signature mismatch for order=${razorpay_order_id}`);
            await prisma.payment.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: "failed" },
            });
            return ErrorResponse({
                message: "Invalid payment signature",
                status: 400,
            });
        }

        const payment = await prisma.payment.findUnique({
            where: { razorpayOrderId: razorpay_order_id },
        });

        if (!payment) {
            console.error(`[Payment Verify] Payment not found for order=${razorpay_order_id}`);
            return ErrorResponse({ message: "Payment not found", status: 404 });
        }

        if (payment.status === "paid") {
            console.log(`[Payment Verify] Already processed order=${razorpay_order_id}`);
            return ErrorResponse({
                message: "Payment already processed",
                status: 400,
            });
        }

        // Convert paisa → rupees, apply 2.4% fee
        const amountInRupees = payment.amount / 100;
        const ucAmount = Math.floor(
            amountInRupees * (1 - PLATFORM_FEE_PERCENT / 100)
        );

        // Credit local game wallet — must succeed before marking payment as paid
        const playerEmail = await getEmailByPlayerId(payment.playerId);
        if (!playerEmail) {
            console.error(`[Payment Verify] No email for player=${payment.playerId}, order=${razorpay_order_id}`);
            return ErrorResponse({ message: "Player email not found — cannot credit wallet", status: 500 });
        }

        console.log(`[Payment Verify] Crediting ${ucAmount} UC to ${playerEmail} (order=${razorpay_order_id})`);

        const description = `Added ${ucAmount} ${GAME.currency} via Razorpay`;
        await creditWallet(playerEmail, ucAmount, description, "TOP_UP");

        // Only mark paid AFTER wallet credit succeeds
        await prisma.payment.update({
            where: { razorpayOrderId: razorpay_order_id },
            data: {
                razorpayPaymentId: razorpay_payment_id,
                status: "paid",
            },
        });

        console.log(`[Payment Verify] ✅ Success: ${ucAmount} UC credited, order=${razorpay_order_id}`);

        return SuccessResponse({
            data: { ucAdded: ucAmount },
            message: `Successfully added ${ucAmount} ${GAME.currency} to your balance`,
            cache: CACHE.NONE,
        });
    } catch (error) {
        console.error("[Payment Verify] EXCEPTION:", error);
        return ErrorResponse({
            message: "Payment verification failed",
            error,
        });
    }
}
