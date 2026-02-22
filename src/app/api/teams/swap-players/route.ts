import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * POST /api/teams/swap-players
 * Swap two players between two teams in the same tournament.
 * Updates: Team.players, TeamPlayerStats, MatchPlayerPlayed, team names.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const { teamAId, playerAId, teamBId, playerBId } = await request.json() as {
            teamAId: string;
            playerAId: string;
            teamBId: string;
            playerBId: string;
        };

        if (!teamAId || !playerAId || !teamBId || !playerBId) {
            return ErrorResponse({ message: "All four IDs are required", status: 400 });
        }

        // 1. Validate both teams exist, same tournament, players belong
        const [teamA, teamB] = await Promise.all([
            prisma.team.findUnique({
                where: { id: teamAId },
                include: { players: { select: { id: true } } },
            }),
            prisma.team.findUnique({
                where: { id: teamBId },
                include: { players: { select: { id: true } } },
            }),
        ]);

        if (!teamA || !teamB) return ErrorResponse({ message: "Team not found", status: 404 });
        if (teamA.tournamentId !== teamB.tournamentId) {
            return ErrorResponse({ message: "Teams must be in the same tournament", status: 400 });
        }
        if (!teamA.players.some((p) => p.id === playerAId)) {
            return ErrorResponse({ message: "Player A is not on Team A", status: 400 });
        }
        if (!teamB.players.some((p) => p.id === playerBId)) {
            return ErrorResponse({ message: "Player B is not on Team B", status: 400 });
        }

        // 2. Swap player connections on teams
        await prisma.team.update({ where: { id: teamAId }, data: { players: { disconnect: { id: playerAId } } } });
        await prisma.team.update({ where: { id: teamBId }, data: { players: { disconnect: { id: playerBId } } } });
        await prisma.team.update({ where: { id: teamAId }, data: { players: { connect: { id: playerBId } } } });
        await prisma.team.update({ where: { id: teamBId }, data: { players: { connect: { id: playerAId } } } });

        // 3. Swap stats records (TeamPlayerStats + MatchPlayerPlayed)
        await prisma.$transaction([
            prisma.teamPlayerStats.updateMany({
                where: { playerId: playerAId, teamId: teamAId },
                data: { teamId: teamBId },
            }),
            prisma.teamPlayerStats.updateMany({
                where: { playerId: playerBId, teamId: teamBId },
                data: { teamId: teamAId },
            }),
            prisma.matchPlayerPlayed.updateMany({
                where: { playerId: playerAId, teamId: teamAId },
                data: { teamId: teamBId },
            }),
            prisma.matchPlayerPlayed.updateMany({
                where: { playerId: playerBId, teamId: teamBId },
                data: { teamId: teamAId },
            }),
        ]);

        // 4. Update team names to reflect new composition
        const [updatedA, updatedB] = await Promise.all([
            prisma.team.findUnique({
                where: { id: teamAId },
                include: { players: { include: { user: { select: { username: true } } } } },
            }),
            prisma.team.findUnique({
                where: { id: teamBId },
                include: { players: { include: { user: { select: { username: true } } } } },
            }),
        ]);

        await Promise.all([
            updatedA && prisma.team.update({
                where: { id: teamAId },
                data: { name: updatedA.players.map((p) => p.user.username).join("_") },
            }),
            updatedB && prisma.team.update({
                where: { id: teamBId },
                data: { name: updatedB.players.map((p) => p.user.username).join("_") },
            }),
        ]);

        return SuccessResponse({ message: "Players swapped successfully" });
    } catch (error) {
        return ErrorResponse({ message: "Failed to swap players", error });
    }
}
