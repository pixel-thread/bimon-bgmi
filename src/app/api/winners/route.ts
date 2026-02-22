import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * GET /api/winners?tournamentId=...
 * Fetches tournament winners with team and player details.
 */
export async function GET(request: NextRequest) {
    try {
        const tournamentId = request.nextUrl.searchParams.get("tournamentId");

        if (!tournamentId) {
            return ErrorResponse({
                message: "tournamentId is required",
                status: 400,
            });
        }

        const winners = await prisma.tournamentWinner.findMany({
            where: { tournamentId },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        teamNumber: true,
                        players: {
                            select: {
                                id: true,
                                displayName: true,
                                customProfileImageUrl: true,
                                user: {
                                    select: {
                                        username: true,
                                        imageUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { position: "asc" },
        });

        const data = winners.map((w) => ({
            id: w.id,
            position: w.position,
            amount: w.amount,
            isDistributed: w.isDistributed,
            teamName: w.team.name,
            teamNumber: w.team.teamNumber,
            players: w.team.players.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                username: p.user.username,
                imageUrl: p.customProfileImageUrl || p.user.imageUrl,
            })),
        }));

        return SuccessResponse({ data, cache: CACHE.MEDIUM });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch winners", error });
    }
}
