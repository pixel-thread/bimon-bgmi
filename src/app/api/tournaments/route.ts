import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * GET /api/tournaments
 * Fetches tournaments with pagination, search, and status filter.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status") ?? "ALL";
        const search = searchParams.get("search") ?? "";
        const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
        const cursor = searchParams.get("cursor");

        const where: Record<string, unknown> = {};

        if (status !== "ALL") {
            where.status = status;
        }

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const tournaments = await prisma.tournament.findMany({
            where,
            include: {
                season: { select: { id: true, name: true } },
                _count: {
                    select: {
                        teams: true,
                        matches: true,
                        winners: true,
                    },
                },
                poll: {
                    select: {
                        id: true,
                        isActive: true,
                        _count: { select: { votes: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        });

        const hasMore = tournaments.length > limit;
        const results = hasMore ? tournaments.slice(0, limit) : tournaments;
        const nextCursor = hasMore ? results[results.length - 1]?.id : null;

        const data = results.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            fee: t.fee,
            status: t.status,
            isWinnerDeclared: t.isWinnerDeclared,
            season: t.season,
            startDate: t.startDate,
            createdAt: t.createdAt,
            teamCount: t._count.teams,
            matchCount: t._count.matches,
            winnerCount: t._count.winners,
            poll: t.poll
                ? {
                    id: t.poll.id,
                    isActive: t.poll.isActive,
                    voteCount: t.poll._count.votes,
                }
                : null,
        }));

        return SuccessResponse({
            data,
            meta: { hasMore, nextCursor, count: results.length },
            cache: CACHE.SHORT,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch tournaments",
            error,
        });
    }
}
