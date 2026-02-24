import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { getCategoryFromKDValue } from "@/lib/logic/categoryUtils";

/**
 * GET /api/players
 * Fetches paginated players with stats and wallet.
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
        const season = searchParams.get("season") ?? "";
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
                { user: { username: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { displayName: { contains: search, mode: "insensitive" } },
            ];
        }

        if (tier && tier !== "All") {
            where.category = tier;
        }

        // Build orderBy
        const orderByMap: Record<string, unknown> = {
            kd: { stats: { _count: sortOrder } },
            kills: { stats: { _count: sortOrder } },
            matches: { stats: { _count: sortOrder } },
            name: { user: { username: sortOrder } },
            balance: { wallet: { balance: sortOrder } },
        };

        // Default fallback for ordering
        const orderBy = orderByMap[sortBy] ?? { createdAt: "desc" };

        // Determine if we can sort via Prisma or need JS sort
        const prismaSort = sortBy === "name"
            ? { user: { username: sortOrder } }
            : null;

        // Fetch players
        const players = await prisma.player.findMany({
            where,
            include: {
                user: {
                    select: {
                        username: true,
                        imageUrl: true,
                    },
                },
                wallet: {
                    select: {
                        balance: true,
                    },
                },
                characterImage: {
                    select: {
                        publicUrl: true,
                        isAnimated: true,
                        isVideo: true,
                        thumbnailUrl: true,
                    },
                },
            },
            ...(prismaSort
                ? {
                    take: limit + 1,
                    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
                    orderBy: prismaSort as any,
                }
                : {}), // fetch all for JS sort
        });

        // Batch compute stats from TeamPlayerStats (source of truth)
        const playerIds = players.map((p) => p.id);

        // Default to active season if none specified
        let seasonId = season;
        if (!seasonId) {
            const activeSeason = await prisma.season.findFirst({
                where: { status: "ACTIVE" },
                select: { id: true },
            });
            if (activeSeason) seasonId = activeSeason.id;
        }

        const tpsWhere: Record<string, unknown> = { playerId: { in: playerIds } };
        if (seasonId) {
            tpsWhere.seasonId = seasonId;
        }
        const tpsAgg = await prisma.teamPlayerStats.groupBy({
            by: ["playerId"],
            where: tpsWhere,
            _count: { matchId: true },
            _sum: { kills: true },
        });
        const statsMap = new Map(tpsAgg.map((s) => [s.playerId, { kills: s._sum.kills ?? 0, matches: s._count.matchId }]));

        // Flatten the data — compute category from K/D (always fresh)
        const allData = players.map((p) => {
            const st = statsMap.get(p.id) ?? { kills: 0, matches: 0 };
            const kd = st.matches > 0 ? st.kills / st.matches : 0;
            return {
                id: p.id,
                displayName: p.displayName,
                bio: p.bio || `nga u ${p.displayName || p.user.username} dei u ${getCategoryFromKDValue(kd)}`,
                username: p.user.username,
                imageUrl: p.customProfileImageUrl || p.user.imageUrl,
                category: getCategoryFromKDValue(kd),
                isBanned: p.isBanned,
                stats: { kills: st.kills, matches: st.matches, kd: Number(kd.toFixed(2)) },
                balance: p.wallet?.balance ?? 0,
                hasRoyalPass: p.hasRoyalPass,
                characterImage: p.characterImage
                    ? {
                        url: p.characterImage.publicUrl,
                        isAnimated: p.characterImage.isAnimated,
                        isVideo: p.characterImage.isVideo,
                        thumbnailUrl: p.characterImage.thumbnailUrl,
                    }
                    : null,
            };
        });

        let data;
        let hasMore: boolean;
        let nextCursor: string | null;

        if (prismaSort) {
            // Prisma already sorted & paginated
            hasMore = allData.length > limit;
            data = hasMore ? allData.slice(0, limit) : allData;
            nextCursor = hasMore ? data[data.length - 1]?.id : null;
        } else {
            // JS sort for kd/kills/matches/balance
            const sortKey = sortBy as "kd" | "kills" | "matches" | "balance";
            allData.sort((a, b) => {
                const aVal = sortKey === "balance" ? a.balance : a.stats[sortKey as keyof typeof a.stats] as number;
                const bVal = sortKey === "balance" ? b.balance : b.stats[sortKey as keyof typeof b.stats] as number;
                return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
            });

            // Manual cursor-based pagination
            let startIdx = 0;
            if (cursor) {
                const cursorIdx = allData.findIndex((p) => p.id === cursor);
                startIdx = cursorIdx >= 0 ? cursorIdx + 1 : 0;
            }
            const slice = allData.slice(startIdx, startIdx + limit + 1);
            hasMore = slice.length > limit;
            data = hasMore ? slice.slice(0, limit) : slice;
            nextCursor = hasMore ? data[data.length - 1]?.id : null;
        }

        // Check if the requester is admin for meta data
        const user = await getCurrentUser();

        const meta: Record<string, unknown> = {
            hasMore,
            nextCursor,
            count: data.length,
        };

        // Add balance totals for super admins (exclude admin wallets)
        if (user?.role === "SUPER_ADMIN") {
            const adminFilter = {
                player: {
                    user: {
                        role: { notIn: ["SUPER_ADMIN" as const, "ADMIN" as const] },
                    },
                },
            };
            const aggregations = await prisma.wallet.aggregate({
                where: adminFilter,
                _sum: { balance: true },
            });
            const negativeSum = await prisma.wallet.aggregate({
                where: { ...adminFilter, balance: { lt: 0 } },
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
