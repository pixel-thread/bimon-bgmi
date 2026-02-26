import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tournaments — Create a new tournament (admin only).
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, fee, seasonId } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const tournament = await prisma.tournament.create({
            data: {
                name: name.trim(),
                description: description || null,
                fee: fee ? Number(fee) : null,
                seasonId: seasonId || null,
                createdBy: user.id,
                startDate: new Date(),
            },
        });

        return NextResponse.json({ success: true, data: tournament });
    } catch (error) {
        console.error("Error creating tournament:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

/**
 * GET /api/tournaments
 * Fetches tournaments with pagination, search, and status filter.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status") ?? "ALL";
        const search = searchParams.get("search") ?? "";
        const seasonId = searchParams.get("seasonId");
        const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
        const cursor = searchParams.get("cursor");

        const where: Record<string, unknown> = {};

        if (status !== "ALL") {
            where.status = status;
        }

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        if (seasonId) {
            where.seasonId = seasonId;
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
                        teamStats: true,
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

        const data = results.map((t) => {
            return {
                id: t.id,
                name: t.name,
                description: t.description,
                fee: t.fee,
                status: t.status,
                isWinnerDeclared: t.isWinnerDeclared,
                season: t.season,
                startDate: t.startDate,
                createdAt: t.createdAt,
                teamCount: t._count.teams > 0 ? t._count.teams : t._count.teamStats,
                matchCount: t._count.matches,
                winnerCount: t._count.winners,
                poll: t.poll
                    ? {
                        id: t.poll.id,
                        isActive: t.poll.isActive,
                        voteCount: t.poll._count.votes,
                    }
                    : null,
            };
        });

        return SuccessResponse({
            data,
            meta: { hasMore, nextCursor, count: results.length },
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch tournaments",
            error,
        });
    }
}
