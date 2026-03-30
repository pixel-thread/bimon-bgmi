import { NextRequest, NextResponse } from "next/server";
import { creditWallet, debitWallet, getEmailByPlayerId } from "@/lib/wallet-service";

/**
 * POST /api/players/[id]/wallet
 * Credit or debit B-Coins from a player's wallet (admin).
 * Body: { amount: number, type: "CREDIT" | "DEBIT", description: string }
 *
 * The wallet service handles routing: central wallet for unified games,
 * local DB for isolated games (Free Fire).
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

        const email = await getEmailByPlayerId(id);
        if (!email) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        // Wallet service handles central vs local routing
        const result = type === "CREDIT"
            ? await creditWallet(email, amount, description, "ADMIN_ADJUSTMENT")
            : await debitWallet(email, amount, description, "ADMIN_ADJUSTMENT");

        return NextResponse.json({
            balance: result.balance,
            transaction: result.transaction ? {
                id: result.transaction.id,
                amount: result.transaction.amount,
                type: result.transaction.type,
                description: result.transaction.description,
                createdAt: result.transaction.createdAt,
            } : null,
        });
    } catch (error) {
        console.error("Failed to update wallet:", error);
        return NextResponse.json(
            { error: "Failed to update wallet" },
            { status: 500 }
        );
    }
}
