import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { generateBracket } from "@/lib/logic/generateBracket";
import { type NextRequest } from "next/server";

/**
 * POST /api/tournaments/[id]/generate-bracket
 * Generate a 1v1 bracket from poll voters (IN/SOLO).
 * Only for BRACKET_1V1 tournaments.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;

        // Verify tournament exists and is the right type
        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: {
                id: true,
                type: true,
                status: true,
                poll: {
                    select: {
                        id: true,
                        isActive: true,
                        votes: {
                            where: { vote: { in: ["IN", "SOLO"] } },
                            select: { playerId: true },
                        },
                    },
                },
                bracketMatches: { select: { id: true }, take: 1 },
            },
        });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

        if (tournament.type !== "BRACKET_1V1") {
            return ErrorResponse({
                message: "This tournament is not a 1v1 bracket tournament",
                status: 400,
            });
        }

        if (tournament.bracketMatches.length > 0) {
            return ErrorResponse({
                message: "Bracket already generated. Delete existing bracket first.",
                status: 400,
            });
        }

        if (!tournament.poll) {
            return ErrorResponse({ message: "No poll found for this tournament", status: 400 });
        }

        const playerIds = tournament.poll.votes.map((v) => v.playerId);

        if (playerIds.length < 2) {
            return ErrorResponse({
                message: `Need at least 2 players. Currently ${playerIds.length} voted IN.`,
                status: 400,
            });
        }

        // Close the poll if still active
        if (tournament.poll.isActive) {
            await prisma.poll.update({
                where: { id: tournament.poll.id },
                data: { isActive: false },
            });
        }

        // Generate the bracket
        const result = await generateBracket(id, playerIds);

        return SuccessResponse({
            data: result,
            message: `Bracket generated! ${result.totalPlayers} players, ${result.totalRounds} rounds.`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to generate bracket", error });
    }
}
