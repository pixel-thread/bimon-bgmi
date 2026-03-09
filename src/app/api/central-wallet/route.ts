import { NextRequest, NextResponse } from "next/server";
import { getAuthEmail, getAuthName, getAuthImage } from "@/lib/auth";
import { getCentralTransactions, getOrCreateCentralWallet } from "@/lib/wallet-service";

/**
 * GET /api/central-wallet
 * 
 * Returns the user's central wallet balance and recent transactions.
 * Query params:
 *   - game: filter transactions by game (optional)
 *   - limit: number of transactions (default 20)
 *   - cursor: pagination cursor (optional)
 */
export async function GET(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const game = searchParams.get("game") || undefined;
        const limit = parseInt(searchParams.get("limit") || "20");
        const cursor = searchParams.get("cursor") || undefined;

        // Ensure user has a central wallet (creates if needed)
        const name = await getAuthName();
        const image = await getAuthImage();
        const { wallet } = await getOrCreateCentralWallet(email, name, image);

        // Get transactions
        const { transactions, hasMore } = await getCentralTransactions(email, {
            game,
            limit,
            cursor,
        });

        return NextResponse.json({
            data: {
                balance: wallet.balance,
                transactions: transactions.map((tx: any) => ({
                    id: tx.id,
                    amount: tx.amount,
                    type: tx.type,
                    reason: tx.reason,
                    description: tx.description,
                    game: tx.game,
                    balanceBefore: tx.balanceBefore,
                    balanceAfter: tx.balanceAfter,
                    createdAt: tx.createdAt,
                })),
                hasMore,
            },
        });
    } catch (error) {
        console.error("[central-wallet] GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch wallet" },
            { status: 500 }
        );
    }
}
