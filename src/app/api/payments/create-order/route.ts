import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";

// Platform fee percentage (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;

const createOrderSchema = z.object({
    amount: z
        .number()
        .min(10, "Minimum amount is ₹10")
        .max(10000, "Maximum amount is ₹10,000"),
    amountInPaise: z
        .number()
        .min(1000, "Minimum amount is 1000 paise")
        .max(1000000, "Maximum amount is 1000000 paise")
        .optional(),
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for adding UC balance.
 * Body: { amount: number (in rupees), amountInPaise?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        // Find the player
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({
                message: "Only players can add balance",
                status: 403,
            });
        }

        const body = await req.json();
        const { amount, amountInPaise } = createOrderSchema.parse(body);

        // Use exact paise if provided, otherwise convert from rupees
        const finalAmountInPaisa = amountInPaise ?? Math.round(amount * 100);

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: finalAmountInPaisa,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user.id,
                playerId: user.player.id,
            },
        });

        // Save order to database
        await prisma.payment.create({
            data: {
                razorpayOrderId: order.id,
                amount: finalAmountInPaisa,
                currency: "INR",
                status: "created",
                userId: user.id,
                playerId: user.player.id,
            },
        });

        return SuccessResponse({
            data: {
                orderId: order.id,
                amount: finalAmountInPaisa,
                currency: "INR",
                keyId: process.env.RAZORPAY_KEY_ID,
            },
            message: "Order created successfully",
            cache: CACHE.NONE,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to create payment order",
            error,
        });
    }
}
