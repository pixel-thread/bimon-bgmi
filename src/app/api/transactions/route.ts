import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * GET /api/transactions
 * Fetches the current user's transaction history.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { searchParams } = request.nextUrl;
        const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100);
        const cursor = searchParams.get("cursor");

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const transactions = await prisma.transaction.findMany({
            where: { playerId: user.player.id },
            orderBy: { createdAt: "desc" },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        });

        const hasMore = transactions.length > limit;
        const results = hasMore ? transactions.slice(0, limit) : transactions;
        const nextCursor = hasMore ? results[results.length - 1]?.id : null;

        const data = results.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            createdAt: t.createdAt,
        }));

        return SuccessResponse({
            data,
            meta: { hasMore, nextCursor, count: results.length },
            cache: CACHE.NONE,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch transactions",
            error,
        });
    }
}
