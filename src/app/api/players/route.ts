import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/players
 * Fetches paginated players with stats, wallet, and character image.
 * Supports search, tier filter, sorting, and cursor-based pagination.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        const search = searchParams.get("search") ?? "";
        const tier = searchParams.get("tier") ?? "All";
        const sortBy = searchParams.get("sortBy") ?? "kd";
        const sortOrder = (searchParams.get("sortOrder") ?? "desc") as
            | "asc"
            | "desc";
        const cursor = searchParams.get("cursor");
        const limit = Math.min(
            Number(searchParams.get("limit") ?? "20"),
            50
        );

        // Build where clause
        const where: Record<string, unknown> = {
            isBanned: false,
        };

        if (search) {
            where.OR = [
                { displayName: { contains: search, mode: "insensitive" } },
                { user: { username: { contains: search, mode: "insensitive" } } },
            ];
        }

        if (tier && tier !== "All") {
            where.category = tier;
        }

        // Build orderBy
        const orderByMap: Record<string, unknown> = {
            kd: { stats: { some: { kd: sortOrder } } },
            kills: { stats: { some: { kills: sortOrder } } },
            matches: { stats: { some: { matches: sortOrder } } },
            name: { displayName: sortOrder },
            balance: { wallet: { balance: sortOrder } },
        };

        // Default fallback for ordering
        const orderBy = orderByMap[sortBy] ?? { createdAt: "desc" };

        // Fetch players using cursor-based pagination
        const players = await prisma.player.findMany({
            where,
            include: {
                user: {
                    select: {
                        username: true,
                        imageUrl: true,
                    },
                },
                stats: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        kills: true,
                        deaths: true,
                        matches: true,
                        kd: true,
                    },
                },
                wallet: {
                    select: {
                        balance: true,
                    },
                },
                characterImage: {
                    select: {
                        url: true,
                        thumbnailUrl: true,
                        isAnimated: true,
                        isVideo: true,
                    },
                },
            },
            take: limit + 1, // fetch one extra for nextCursor
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: typeof orderBy === "object" ? orderBy as any : { createdAt: "desc" },
        });

        // Determine if there are more results
        const hasMore = players.length > limit;
        const results = hasMore ? players.slice(0, limit) : players;
        const nextCursor = hasMore ? results[results.length - 1]?.id : null;

        // Flatten the data for the client
        const data = results.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            username: p.user.username,
            imageUrl: p.user.imageUrl,
            category: p.category,
            isBanned: p.isBanned,
            characterImage: p.characterImage
                ? {
                    url: p.characterImage.url,
                    thumbnailUrl: p.characterImage.thumbnailUrl,
                    isAnimated: p.characterImage.isAnimated,
                    isVideo: p.characterImage.isVideo,
                }
                : null,
            stats: p.stats[0]
                ? {
                    kills: p.stats[0].kills,
                    deaths: p.stats[0].deaths,
                    matches: p.stats[0].matches,
                    kd: Number(p.stats[0].kd),
                }
                : { kills: 0, deaths: 0, matches: 0, kd: 0 },
            balance: p.wallet?.balance ?? 0,
            hasRoyalPass: p.hasRoyalPass,
        }));

        // Check if the requester is admin for meta data
        const user = await getCurrentUser();
        const isAdmin =
            user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

        const meta: Record<string, unknown> = {
            hasMore,
            nextCursor,
            count: results.length,
        };

        // Add balance totals for super admins
        if (user?.role === "SUPER_ADMIN") {
            const aggregations = await prisma.wallet.aggregate({
                _sum: { balance: true },
            });
            const negativeSum = await prisma.wallet.aggregate({
                where: { balance: { lt: 0 } },
                _sum: { balance: true },
            });
            meta.totalBalance = aggregations._sum.balance ?? 0;
            meta.negativeBalance = negativeSum._sum.balance ?? 0;
        }

        return SuccessResponse({
            data,
            meta,
            cache: CACHE.SHORT,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch players", error });
    }
}
