import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

interface TeamMember {
    id: string;
    name: string | null;
    avatar: string | null;
}

interface TeamData {
    id: string;
    name: string;
    members: TeamMember[];
}

/**
 * GET /api/bracket-matches/[id]/team-members
 * Returns the team members for both sides of a bracket match.
 * Looks up the tournament's Team records that contain the match participants.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: matchId } = await params;

        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                player1Id: true,
                player2Id: true,
                tournamentId: true,
            },
        });

        if (!match) {
            return ErrorResponse({ message: "Match not found", status: 404 });
        }

        const playerIds = [match.player1Id, match.player2Id].filter(Boolean) as string[];

        // Find teams for this tournament that contain player1 or player2
        const teams = await prisma.team.findMany({
            where: {
                tournamentId: match.tournamentId,
                players: {
                    some: { id: { in: playerIds } },
                },
            },
            select: {
                id: true,
                name: true,
                players: {
                    select: {
                        id: true,
                        displayName: true,
                        customProfileImageUrl: true,
                        user: { select: { imageUrl: true } },
                    },
                },
            },
        });

        const toTeamData = (team: typeof teams[0] | undefined): TeamData | null => {
            if (!team) return null;
            return {
                id: team.id,
                name: team.name,
                members: team.players.map((p) => ({
                    id: p.id,
                    name: p.displayName,
                    avatar: p.customProfileImageUrl || p.user?.imageUrl || null,
                })),
            };
        };

        // Map to player1's team and player2's team
        const team1 = teams.find(t => t.players.some(p => p.id === match.player1Id));
        const team2 = teams.find(t => t.players.some(p => p.id === match.player2Id));

        return SuccessResponse({
            data: {
                team1: toTeamData(team1),
                team2: toTeamData(team2),
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to load team members", error });
    }
}
