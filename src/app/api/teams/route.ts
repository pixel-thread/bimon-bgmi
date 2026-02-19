import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * GET /api/teams
 * Fetches teams for a specific tournament with players and stats.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const tournamentId = searchParams.get("tournamentId");

        if (!tournamentId) {
            return ErrorResponse({
                message: "tournamentId is required",
                status: 400,
            });
        }

        const teams = await prisma.team.findMany({
            where: { tournamentId },
            include: {
                players: {
                    select: {
                        id: true,
                        displayName: true,
                        user: {
                            select: {
                                username: true,
                                imageUrl: true,
                            },
                        },
                        category: true,
                    },
                },
                tournamentWinner: {
                    select: {
                        position: true,
                        amount: true,
                        isDistributed: true,
                    },
                },
                _count: {
                    select: { matches: true },
                },
            },
            orderBy: { teamNumber: "asc" },
        });

        const data = teams.map((team) => ({
            id: team.id,
            name: team.name,
            teamNumber: team.teamNumber,
            matchCount: team._count.matches,
            winner: team.tournamentWinner[0] ?? null,
            players: team.players.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                username: p.user.username,
                imageUrl: p.user.imageUrl,
                category: p.category,
            })),
        }));

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch teams", error });
    }
}
