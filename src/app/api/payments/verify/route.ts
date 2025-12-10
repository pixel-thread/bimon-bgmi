import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";
import crypto from "crypto";

const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
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
            // Mark payment as failed
            await prisma.payment.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: "failed" },
            });
            return ErrorResponse({ message: "Invalid payment signature", status: 400 });
        }

        // Find the payment record
        const payment = await prisma.payment.findUnique({
            where: { razorpayOrderId: razorpay_order_id },
        });

        if (!payment) {
            return ErrorResponse({ message: "Payment not found", status: 404 });
        }

        if (payment.status === "paid") {
            return ErrorResponse({ message: "Payment already processed", status: 400 });
        }

        // Convert paisa back to UC (₹1 = 1 UC, 100 paisa = 1 UC)
        const ucAmount = payment.amount / 100;

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

            // Credit UC balance
            await tx.uC.update({
                where: { playerId: payment.playerId },
                data: {
                    balance: { increment: ucAmount },
                },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    amount: ucAmount,
                    type: "credit",
                    description: `Added ${ucAmount} UC via Razorpay`,
                    playerId: payment.playerId,
                },
            });
        });

        return SuccessResponse({
            data: { ucAdded: ucAmount },
            message: `Successfully added ${ucAmount} UC to your balance`,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
