import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { type NextRequest } from "next/server";

/**
 * POST /api/bracket-matches/[id]/random-pick
 * Admin randomly picks a winner for a no-show/stalled match.
 * Used when neither player submits a result within the deadline.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id: matchId } = await params;

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

        if (match.status !== "PENDING") {
            return ErrorResponse({
                message: "Can only random-pick on pending matches",
                status: 400,
            });
        }

        if (!match.player1Id || !match.player2Id) {
            return ErrorResponse({
                message: "Both players must be assigned to random pick",
                status: 400,
            });
        }

        // Randomly pick a winner
        const winnerId = Math.random() < 0.5 ? match.player1Id : match.player2Id;
        const winnerIsP1 = winnerId === match.player1Id;

        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: {
                winnerId,
                score1: winnerIsP1 ? 1 : 0,
                score2: winnerIsP1 ? 0 : 1,
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
                ? "Winner randomly selected and advanced."
                : "Winner randomly selected.",
            data: { winnerId },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to random pick", error });
    }
}
