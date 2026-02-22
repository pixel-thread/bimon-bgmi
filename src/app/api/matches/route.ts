import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * GET /api/matches
 * Fetches matches for a specific tournament with team stats and player kills/deaths.
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

        const matches = await prisma.match.findMany({
            where: { tournamentId },
            include: {
                teamStats: {
                    include: {
                        team: {
                            select: { id: true, name: true, teamNumber: true },
                        },
                        teamPlayerStats: {
                            include: {
                                player: {
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
                            orderBy: { kills: "desc" },
                        },
                    },
                    orderBy: { position: "asc" },
                },
            },
            orderBy: { matchNumber: "asc" },
        });

        const data = matches.map((match) => ({
            id: match.id,
            matchNumber: match.matchNumber,
            createdAt: match.createdAt,
            teams: match.teamStats.map((ts) => ({
                teamId: ts.team.id,
                teamName: ts.team.name,
                teamNumber: ts.team.teamNumber,
                position: ts.position,
                players: ts.teamPlayerStats.map((tps) => ({
                    id: tps.player.id,
                    displayName: tps.player.displayName,
                    username: tps.player.user.username,
                    imageUrl: tps.player.customProfileImageUrl || tps.player.user.imageUrl,
                    kills: tps.kills,
                    present: tps.present,
                })),
            })),
        }));

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch matches", error });
    }
}
