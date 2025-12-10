import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";
import Razorpay from "razorpay";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";

const createOrderSchema = z.object({
    amount: z.number().min(100, "Minimum amount is ₹100").max(10000, "Maximum amount is ₹10,000"),
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const user = await superAdminMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const playerId = user.playerId || user.player?.id;
        if (!playerId) {
            return ErrorResponse({ message: "Only players can add balance", status: 403 });
        }

        const body = await req.json();
        const { amount } = createOrderSchema.parse(body);

        // Convert to paisa (₹1 = 100 paisa)
        const amountInPaisa = amount * 100;

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaisa,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user.id,
                playerId: playerId,
            },
        });

        // Save order to database
        await prisma.payment.create({
            data: {
                razorpayOrderId: order.id,
                amount: amountInPaisa,
                currency: "INR",
                status: "created",
                userId: user.id,
                playerId: playerId,
            },
        });

        return SuccessResponse({
            data: {
                orderId: order.id,
                amount: amountInPaisa,
                currency: "INR",
                keyId: process.env.RAZORPAY_KEY_ID,
            },
            message: "Order created successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
