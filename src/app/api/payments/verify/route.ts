import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";

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
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            verifyPaymentSchema.parse(body);

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
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
            return ErrorResponse({ message: "Payment not found", status: 404 });
        }

        if (payment.status === "paid") {
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

        // Update payment status and credit UC balance in a transaction
        await prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.payment.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: {
                    razorpayPaymentId: razorpay_payment_id,
                    status: "paid",
                },
            });

            // Ensure wallet exists, then credit UC balance
            await tx.wallet.upsert({
                where: { playerId: payment.playerId },
                create: {
                    playerId: payment.playerId,
                    balance: ucAmount,
                },
                update: {
                    balance: { increment: ucAmount },
                },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    amount: ucAmount,
                    type: "CREDIT",
                    description: `Added ${ucAmount} UC via Razorpay`,
                    playerId: payment.playerId,
                },
            });
        });

        return SuccessResponse({
            data: { ucAdded: ucAmount },
            message: `Successfully added ${ucAmount} UC to your balance`,
            cache: CACHE.NONE,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Payment verification failed",
            error,
        });
    }
}
