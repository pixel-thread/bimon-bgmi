import { prisma } from "@/lib/database";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * POST /api/bracket-matches/[id]/dispute
 * Opponent disputes a submitted result.
 * Body: { screenshotUrl?: string, reason?: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthEmail();
        if (!userId) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const { id: matchId } = await params;
        const body = await req.json();
        const { screenshotUrl } = body as { screenshotUrl?: string };

        const user = await prisma.user.findFirst({
            where: userWhereEmail(userId),
            select: { player: { select: { id: true } } },
        });
        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }
        const playerId = user.player.id;

        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                status: true,
                player1Id: true,
                player2Id: true,
                winnerId: true,
                score1: true,
                score2: true,
                disputeDeadline: true,
            },
        });

        if (!match) {
            return ErrorResponse({ message: "Match not found", status: 404 });
        }

        if (match.status !== "SUBMITTED") {
            return ErrorResponse({
                message: "Can only dispute matches in SUBMITTED state",
                status: 400,
            });
        }

        // Check dispute deadline
        if (match.disputeDeadline && new Date() > match.disputeDeadline) {
            return ErrorResponse({
                message: "Dispute window has expired",
                status: 400,
            });
        }

        // Must be a participant (the non-submitting player)
        if (match.player1Id !== playerId && match.player2Id !== playerId) {
            return ErrorResponse({
                message: "You are not a participant in this match",
                status: 403,
            });
        }

        // Save dispute result (opponent's version of events)
        await prisma.bracketResult.create({
            data: {
                bracketMatchId: matchId,
                submittedById: playerId,
                claimedScore1: match.score1 ?? 0, // will be reviewed by admin
                claimedScore2: match.score2 ?? 0,
                screenshotUrl: screenshotUrl || null,
                isDispute: true,
            },
        });

        // Update match status
        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: { status: "DISPUTED" },
        });

        return SuccessResponse({
            message: "Dispute submitted. An admin will review the screenshots and decide.",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to submit dispute", error });
    }
}
