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

        // Perform the swap in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update team player connections
            // Remove playerA from teamA
            await tx.team.update({
                where: { id: teamAId },
                data: {
                    players: { disconnect: { id: playerAId } },
                },
            });

            // Remove playerB from teamB
            await tx.team.update({
                where: { id: teamBId },
                data: {
                    players: { disconnect: { id: playerBId } },
                },
            });

            // Add playerA to teamB
            await tx.team.update({
                where: { id: teamBId },
                data: {
                    players: { connect: { id: playerAId } },
                },
            });

            // Add playerB to teamA
            await tx.team.update({
                where: { id: teamAId },
                data: {
                    players: { connect: { id: playerBId } },
                },
            });

            // 2. Update TeamPlayerStats for all affected matches
            for (const match of matchesToUpdate) {
                // Update playerA's stats to point to teamB
                await tx.teamPlayerStats.updateMany({
                    where: {
                        playerId: playerAId,
                        teamId: teamAId,
                        matchId: match.id,
                    },
                    data: {
                        teamId: teamBId,
                    },
                });

                // Update playerB's stats to point to teamA
                await tx.teamPlayerStats.updateMany({
                    where: {
                        playerId: playerBId,
                        teamId: teamBId,
                        matchId: match.id,
                    },
                    data: {
                        teamId: teamAId,
                    },
                });

                // 3. Update MatchPlayerPlayed records
                await tx.matchPlayerPlayed.updateMany({
                    where: {
                        playerId: playerAId,
                        teamId: teamAId,
                        matchId: match.id,
                    },
                    data: {
                        teamId: teamBId,
                    },
                });

                await tx.matchPlayerPlayed.updateMany({
                    where: {
                        playerId: playerBId,
                        teamId: teamBId,
                        matchId: match.id,
                    },
                    data: {
                        teamId: teamAId,
                    },
                });
            }

            // 4. Update team names to reflect new player composition
            const [updatedTeamA, updatedTeamB] = await Promise.all([
                tx.team.findUnique({
                    where: { id: teamAId },
                    include: { players: { include: { user: true } } },
                }),
                tx.team.findUnique({
                    where: { id: teamBId },
                    include: { players: { include: { user: true } } },
                }),
            ]);

            if (updatedTeamA) {
                const newNameA = updatedTeamA.players.map((p) => p.user.userName).join("_");
                await tx.team.update({
                    where: { id: teamAId },
                    data: { name: newNameA },
                });
            }

            if (updatedTeamB) {
                const newNameB = updatedTeamB.players.map((p) => p.user.userName).join("_");
                await tx.team.update({
                    where: { id: teamBId },
                    data: { name: newNameB },
                });
            }
        });

        return SuccessResponse({
            message: "Players swapped successfully",
            data: { teamAId, teamBId },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
