import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { type NextRequest } from "next/server";

/**
 * PUT /api/bracket-matches/[id]/resolve
 * Admin resolves a disputed match or manually sets result.
 * Body: { winnerId: string, score1: number, score2: number }
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id: matchId } = await params;
        const body = await req.json();
        const { winnerId, score1, score2 } = body as {
            winnerId: string;
            score1: number;
            score2: number;
        };

        if (!winnerId) {
            return ErrorResponse({ message: "winnerId is required", status: 400 });
        }

        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                status: true,
                player1Id: true,
                player2Id: true,
                tournamentId: true,
                round: true,
            },
        });

        if (!match) {
            return ErrorResponse({ message: "Match not found", status: 404 });
        }

        // Verify winner is a participant
        if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
            return ErrorResponse({
                message: "Winner must be one of the match participants",
                status: 400,
            });
        }

        // Update match with admin decision
        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: {
                winnerId,
                score1: score1 ?? null,
                score2: score2 ?? null,
                status: "CONFIRMED",
            },
        });

        // Advance only for knockout-style matches
        const tournament = await prisma.tournament.findUnique({
            where: { id: match.tournamentId },
            select: { type: true },
        });
        const isKnockoutMatch =
            tournament?.type === "BRACKET_1V1" ||
            (tournament?.type === "GROUP_KNOCKOUT" && match.round > 0);

        if (isKnockoutMatch) {
            await advanceWinners(match.tournamentId, match.round);
        }

        return SuccessResponse({
            message: isKnockoutMatch
                ? "Match resolved. Winner advances to next round."
                : "Match resolved.",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to resolve match", error });
    }
}
