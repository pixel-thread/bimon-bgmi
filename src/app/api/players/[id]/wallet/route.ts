import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/players/[id]/wallet
 * Credit or debit UC from a player's wallet.
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

        // Use a Prisma transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Ensure wallet exists
            const wallet = await tx.wallet.upsert({
                where: { playerId: id },
                create: { playerId: id, balance: 0 },
                update: {},
            });

            const balanceChange = type === "CREDIT" ? amount : -amount;
            const newBalance = wallet.balance + balanceChange;

            // Update wallet balance
            const updatedWallet = await tx.wallet.update({
                where: { playerId: id },
                data: { balance: newBalance },
            });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    amount,
                    type,
                    description,
                    playerId: id,
                },
            });

            return { balance: updatedWallet.balance, transaction };
        });

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
