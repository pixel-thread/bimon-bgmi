import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { clearTrustedOnBalanceRecovery } from "@/lib/logic/balanceRecovery";
import { creditCentralWallet, debitCentralWallet, getEmailByPlayerId } from "@/lib/wallet-service";

/**
 * POST /api/players/[id]/wallet
 * Credit or debit B-Coins from a player's wallet (admin).
 * Body: { amount: number, type: "CREDIT" | "DEBIT", description: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { amount, type, description } = await req.json();

        if (!amount || !type || !description) {
            return NextResponse.json(
                { error: "amount, type, and description are required" },
                { status: 400 }
            );
        }

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "amount must be a positive number" },
                { status: 400 }
            );
        }

        if (!["CREDIT", "DEBIT"].includes(type)) {
            return NextResponse.json(
                { error: "type must be CREDIT or DEBIT" },
                { status: 400 }
            );
        }

        // Get player's email for central wallet
        const email = await getEmailByPlayerId(id);
        if (!email) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        // Update central wallet
        let result;
        if (type === "CREDIT") {
            result = await creditCentralWallet(email, amount, description, "ADMIN_ADJUSTMENT");
        } else {
            result = await debitCentralWallet(email, amount, description, "ADMIN_ADJUSTMENT");
        }

        // Keep game DB transaction record for audit trail
        await prisma.transaction.create({
            data: { amount, type, description, playerId: id },
        });

        // Also sync game DB wallet balance
        await prisma.wallet.upsert({
            where: { playerId: id },
            create: { playerId: id, balance: result.balance },
            update: { balance: result.balance },
        });

        // Auto-clear trusted if balance recovered (only on credits)
        if (type === "CREDIT") {
            await prisma.$transaction(async (tx) => {
                await clearTrustedOnBalanceRecovery(id, result.balance, tx);
            });
        }

        return NextResponse.json({
            balance: result.balance,
            transaction: {
                id: result.transaction.id,
                amount: result.transaction.amount,
                type: result.transaction.type,
                description: result.transaction.description,
                createdAt: result.transaction.createdAt,
            },
        });
    } catch (error) {
        console.error("Failed to update wallet:", error);
        return NextResponse.json(
            { error: "Failed to update wallet" },
            { status: 500 }
        );
    }
}
