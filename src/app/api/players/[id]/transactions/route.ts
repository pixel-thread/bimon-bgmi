import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * GET /api/players/[id]/transactions
 * Paginated transaction history for a player.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
        const cursor = searchParams.get("cursor");

        const transactions = await prisma.transaction.findMany({
            where: { playerId: id },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                createdAt: true,
            },
        });

        const hasMore = transactions.length > limit;
        const results = hasMore ? transactions.slice(0, limit) : transactions;
        const nextCursor = hasMore ? results[results.length - 1]?.id : null;

        return NextResponse.json({
            data: results,
            meta: { hasMore, nextCursor },
        });
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
