import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import crypto from "crypto";
import { GAME } from "@/lib/game-config";
import { creditCentralWallet, getEmailByPlayerId } from "@/lib/wallet-service";

// Razorpay platform fee (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler — catches payment events server-side.
 * This ensures UC gets credited even if the client-side callback fails
 * (e.g., user closes browser, page refreshes, network issues).
 *
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL: https://yourdomain.com/api/payments/webhook
 *   Events: payment.captured
 *   Secret: RAZORPAY_WEBHOOK_SECRET env var
 */
export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET not configured");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);

        // Only handle payment.captured events
        if (event.event !== "payment.captured") {
            return NextResponse.json({ status: "ignored" });
        }

        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity) {
            return NextResponse.json({ error: "Missing payment entity" }, { status: 400 });
        }

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        if (!razorpayOrderId || !razorpayPaymentId) {
            return NextResponse.json({ error: "Missing order/payment IDs" }, { status: 400 });
        }

        // Find the payment record
        const payment = await prisma.payment.findUnique({
            where: { razorpayOrderId },
        });

        if (!payment) {
            console.log(`Webhook: Payment not found for order ${razorpayOrderId}`);
            return NextResponse.json({ status: "not_found" });
        }

        // Already processed (idempotent)
        if (payment.status === "paid") {
            console.log(`Webhook: Payment ${razorpayOrderId} already processed`);
            return NextResponse.json({ status: "already_processed" });
        }

        // Calculate UC (same formula as verify endpoint)
        const amountInRupees = payment.amount / 100;
        const ucAmount = Math.floor(
            amountInRupees * (1 - PLATFORM_FEE_PERCENT / 100)
        );

        // Credit central wallet
        const playerEmail = await getEmailByPlayerId(payment.playerId);
        const description = `Added ${ucAmount} ${GAME.currency} via Razorpay`;
        let centralResult: any = null;
        if (playerEmail) {
            centralResult = await creditCentralWallet(playerEmail, ucAmount, description, "TOP_UP");
        }

        // Update payment status
        await prisma.payment.update({
            where: { razorpayOrderId },
            data: { razorpayPaymentId, status: "paid" },
        });

        console.log(
            `Webhook: Credited ${ucAmount} ${GAME.currency} to player ${payment.playerId} (order: ${razorpayOrderId})`
        );

        return NextResponse.json({ status: "ok", ucAdded: ucAmount });
    } catch (error) {
        console.error("Webhook error:", error);
        // Return 200 anyway to prevent Razorpay from retrying on app errors
        // (only return non-200 for signature failures)
        return NextResponse.json({ status: "error" }, { status: 200 });
    }
}
