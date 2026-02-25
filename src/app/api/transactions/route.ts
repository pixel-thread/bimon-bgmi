import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * GET /api/transactions
 * Fetches the current user's transaction history.
 *
 * Query params:
 *  - limit: number of items per page (default 10, max 100)
 *  - cursor: cursor for pagination
 *  - seasonId: filter by season date range (optional)
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const { searchParams } = request.nextUrl;
        const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 100);
        const cursor = searchParams.get("cursor");
        const seasonId = searchParams.get("seasonId");

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Build date filter from season
        let dateFilter: { gte?: Date; lte?: Date } | undefined;
        if (seasonId) {
            const season = await prisma.season.findUnique({
                where: { id: seasonId },
                select: { startDate: true, endDate: true },
            });
            if (season) {
                dateFilter = { gte: season.startDate };
                if (season.endDate) {
                    dateFilter.lte = season.endDate;
                }
            }
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                playerId: user.player.id,
                ...(dateFilter && { createdAt: dateFilter }),
            },
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
