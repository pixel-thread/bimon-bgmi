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

        // Get all team rosters for this tournament (to show absent players too)
        const tournamentTeams = await prisma.team.findMany({
            where: { tournamentId },
            select: {
                id: true,
                players: {
                    select: {
                        id: true,
                        displayName: true,
                        customProfileImageUrl: true,
                        user: { select: { username: true, imageUrl: true } },
                    },
                },
            },
        });
        const teamRosterMap = new Map(tournamentTeams.map(t => [t.id, t.players]));

        const data = matches.map((match) => ({
            id: match.id,
            matchNumber: match.matchNumber,
            createdAt: match.createdAt,
            teams: match.teamStats.map((ts) => {
                // Players who have TPS records (present)
                const tpsPlayers = ts.teamPlayerStats.map((tps) => ({
                    id: tps.player.id,
                    displayName: tps.player.displayName,
                    username: tps.player.user.username,
                    imageUrl: tps.player.customProfileImageUrl || tps.player.user.imageUrl,
                    kills: tps.kills,
                    present: tps.present,
                }));
                const presentIds = new Set(tpsPlayers.map(p => p.id));

                // Add absent players from team roster
                const roster = teamRosterMap.get(ts.team.id) || [];
                const absentPlayers = roster
                    .filter(p => !presentIds.has(p.id))
                    .map(p => ({
                        id: p.id,
                        displayName: p.displayName,
                        username: p.user.username,
                        imageUrl: p.customProfileImageUrl || p.user.imageUrl,
                        kills: 0,
                        present: false,
                    }));

                return {
                    teamId: ts.team.id,
                    teamName: ts.team.name,
                    teamNumber: ts.team.teamNumber,
                    position: ts.position,
                    players: [...tpsPlayers, ...absentPlayers],
                };
            }),
        }));

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch matches", error });
    }
}
