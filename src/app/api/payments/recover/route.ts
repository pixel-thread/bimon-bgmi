import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { GAME } from "@/lib/game-config";
import { creditWallet, getEmailByPlayerId } from "@/lib/wallet-service";

// Razorpay platform fee (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;

/**
 * POST /api/payments/recover
 * Admin-only: Finds "paid" payments that have NO matching wallet transaction
 * and re-credits them. This fixes the bug where payment was marked "paid"
 * before the wallet credit succeeded.
 *
 * Body: { dryRun?: boolean }  — pass dryRun: true to preview without crediting.
 */
export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Admin access required", status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const dryRun = body.dryRun === true;

        // Find all "paid" payments
        const paidPayments = await prisma.payment.findMany({
            where: { status: "paid" },
            orderBy: { createdAt: "asc" },
        });

        const results: Array<{
            razorpayOrderId: string;
            playerId: string;
            email: string | null;
            amountPaisa: number;
            ucExpected: number;
            status: string;
        }> = [];

        for (const payment of paidPayments) {
            const amountInRupees = payment.amount / 100;
            const ucAmount = Math.floor(amountInRupees * (1 - PLATFORM_FEE_PERCENT / 100));
            const description = `Added ${ucAmount} ${GAME.currency} via Razorpay`;

            // Check if a matching transaction already exists for this player
            const existingTx = await prisma.transaction.findFirst({
                where: {
                    playerId: payment.playerId,
                    type: "CREDIT",
                    description: { contains: "via Razorpay" },
                    amount: ucAmount,
                    // Match within 5 minutes of payment creation
                    createdAt: {
                        gte: new Date(payment.createdAt.getTime() - 5 * 60 * 1000),
                        lte: new Date(payment.createdAt.getTime() + 60 * 60 * 1000),
                    },
                },
            });

            if (existingTx) {
                // Transaction exists — wallet was credited correctly
                results.push({
                    razorpayOrderId: payment.razorpayOrderId,
                    playerId: payment.playerId,
                    email: null,
                    amountPaisa: payment.amount,
                    ucExpected: ucAmount,
                    status: "OK — already credited",
                });
                continue;
            }

            // Missing transaction — need to credit
            const playerEmail = await getEmailByPlayerId(payment.playerId);
            if (!playerEmail) {
                results.push({
                    razorpayOrderId: payment.razorpayOrderId,
                    playerId: payment.playerId,
                    email: null,
                    amountPaisa: payment.amount,
                    ucExpected: ucAmount,
                    status: "ERROR — player email not found",
                });
                continue;
            }

            if (dryRun) {
                results.push({
                    razorpayOrderId: payment.razorpayOrderId,
                    playerId: payment.playerId,
                    email: playerEmail,
                    amountPaisa: payment.amount,
                    ucExpected: ucAmount,
                    status: "WOULD_CREDIT",
                });
            } else {
                try {
                    await creditWallet(playerEmail, ucAmount, description, "TOP_UP");
                    results.push({
                        razorpayOrderId: payment.razorpayOrderId,
                        playerId: payment.playerId,
                        email: playerEmail,
                        amountPaisa: payment.amount,
                        ucExpected: ucAmount,
                        status: "CREDITED",
                    });
                } catch (err) {
                    results.push({
                        razorpayOrderId: payment.razorpayOrderId,
                        playerId: payment.playerId,
                        email: playerEmail,
                        amountPaisa: payment.amount,
                        ucExpected: ucAmount,
                        status: `FAILED — ${(err as Error).message}`,
                    });
                }
            }
        }

        const missing = results.filter(r => r.status === "WOULD_CREDIT" || r.status === "CREDITED");
        const ok = results.filter(r => r.status.startsWith("OK"));

        return SuccessResponse({
            data: {
                dryRun,
                totalPaid: paidPayments.length,
                alreadyCredited: ok.length,
                missingCredits: missing.length,
                results,
            },
            message: dryRun
                ? `Found ${missing.length} payments missing wallet credits (dry run — no changes made)`
                : `Recovered ${missing.length} missing wallet credits`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Recovery failed", error });
    }
}
