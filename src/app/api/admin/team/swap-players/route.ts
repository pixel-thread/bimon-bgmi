import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { swapPlayersSchema } from "@/src/utils/validation/team/swap-players-schema";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await adminMiddleware(req);
        const body = swapPlayersSchema.parse(await req.json());

        const { teamAId, playerAId, teamBId, playerBId, matchId } = body;

        // Validate both teams exist and are from the same tournament
        const [teamA, teamB] = await Promise.all([
            prisma.team.findUnique({
                where: { id: teamAId },
                include: { players: true },
            }),
            prisma.team.findUnique({
                where: { id: teamBId },
                include: { players: true },
            }),
        ]);

        if (!teamA || !teamB) {
            return ErrorResponse({
                message: "One or both teams not found",
                status: 404,
            });
        }

        if (teamA.tournamentId !== teamB.tournamentId) {
            return ErrorResponse({
                message: "Teams must be from the same tournament",
                status: 400,
            });
        }

        // Validate players exist on their respective teams
        const playerAOnTeamA = teamA.players.some((p) => p.id === playerAId);
        const playerBOnTeamB = teamB.players.some((p) => p.id === playerBId);

        if (!playerAOnTeamA) {
            return ErrorResponse({
                message: "Player A is not on Team A",
                status: 400,
            });
        }

        if (!playerBOnTeamB) {
            return ErrorResponse({
                message: "Player B is not on Team B",
                status: 400,
            });
        }

        // Get the match to determine which matches to update
        const selectedMatch = await prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!selectedMatch) {
            return ErrorResponse({
                message: "Match not found",
                status: 404,
            });
        }

        // Get all matches from the selected match onwards
        const matchesToUpdate = await prisma.match.findMany({
            where: {
                tournamentId: teamA.tournamentId || undefined,
                createdAt: { gte: selectedMatch.createdAt },
            },
            orderBy: { createdAt: "asc" },
        });

        const matchIds = matchesToUpdate.map((m) => m.id);

        // Step 1: Update team player connections (sequential, not in transaction - PgBouncer compatible)
        // Remove players from their original teams
        await prisma.team.update({
            where: { id: teamAId },
            data: {
                players: { disconnect: { id: playerAId } },
            },
        });

        await prisma.team.update({
            where: { id: teamBId },
            data: {
                players: { disconnect: { id: playerBId } },
            },
        });

        // Add players to their new teams
        await prisma.team.update({
            where: { id: teamBId },
            data: {
                players: { connect: { id: playerAId } },
            },
        });

        await prisma.team.update({
            where: { id: teamAId },
            data: {
                players: { connect: { id: playerBId } },
            },
        });

        // Step 2: Bulk update TeamPlayerStats and MatchPlayerPlayed (PgBouncer compatible batch)
        await prisma.$transaction([
            // Update playerA's stats to point to teamB
            prisma.teamPlayerStats.updateMany({
                where: {
                    playerId: playerAId,
                    teamId: teamAId,
                    matchId: { in: matchIds },
                },
                data: {
                    teamId: teamBId,
                },
            }),
            // Update playerB's stats to point to teamA
            prisma.teamPlayerStats.updateMany({
                where: {
                    playerId: playerBId,
                    teamId: teamBId,
                    matchId: { in: matchIds },
                },
                data: {
                    teamId: teamAId,
                },
            }),
            // Update MatchPlayerPlayed records for playerA
            prisma.matchPlayerPlayed.updateMany({
                where: {
                    playerId: playerAId,
                    teamId: teamAId,
                    matchId: { in: matchIds },
                },
                data: {
                    teamId: teamBId,
                },
            }),
            // Update MatchPlayerPlayed records for playerB
            prisma.matchPlayerPlayed.updateMany({
                where: {
                    playerId: playerBId,
                    teamId: teamBId,
                    matchId: { in: matchIds },
                },
                data: {
                    teamId: teamAId,
                },
            }),
        ]);

        // Step 3: Update team names to reflect new player composition
        const [updatedTeamA, updatedTeamB] = await Promise.all([
            prisma.team.findUnique({
                where: { id: teamAId },
                include: { players: { include: { user: true } } },
            }),
            prisma.team.findUnique({
                where: { id: teamBId },
                include: { players: { include: { user: true } } },
            }),
        ]);

        if (updatedTeamA) {
            const newNameA = updatedTeamA.players.map((p) => p.user.userName).join("_");
            await prisma.team.update({
                where: { id: teamAId },
                data: { name: newNameA },
            });
        }

        if (updatedTeamB) {
            const newNameB = updatedTeamB.players.map((p) => p.user.userName).join("_");
            await prisma.team.update({
                where: { id: teamBId },
                data: { name: newNameB },
            });
        }

        return SuccessResponse({
            message: "Players swapped successfully",
            data: { teamAId, teamBId },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
