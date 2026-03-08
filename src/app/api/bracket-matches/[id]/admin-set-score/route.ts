import { prisma } from "@/lib/database";
import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { type NextRequest } from "next/server";

/**
 * PATCH /api/bracket-matches/[id]/admin-set-score
 * Admin-only: set or override a match score regardless of current status.
 * Body: { score1: number, score2: number, screenshotUrl?: string }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthEmail();
        if (!userId) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const { id: matchId } = await params;
        const body = await req.json();
        const { score1, score2, screenshotUrl } = body as {
            score1: number;
            score2: number;
            screenshotUrl?: string | null;
        };

        if (score1 === undefined || score2 === undefined)
            return ErrorResponse({ message: "score1 and score2 are required", status: 400 });

        // Verify admin
        const user = await prisma.user.findUnique({
            where: { email: userId },
            select: { role: true },
        });
        const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
        if (!isAdmin) return ErrorResponse({ message: "Admin access required", status: 403 });

        // Get match
        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: { id: true, player1Id: true, player2Id: true, tournamentId: true, round: true },
        });
        if (!match) return ErrorResponse({ message: "Match not found", status: 404 });

        // Draws not allowed in knockout
        const tournament = await prisma.tournament.findUnique({
            where: { id: match.tournamentId },
            select: { type: true },
        });
        const isLeague = tournament?.type === "LEAGUE";
        const isGroupStage = tournament?.type === "GROUP_KNOCKOUT" && match.round < 0;
        const drawsAllowed = isLeague || isGroupStage;

        // Determine outcome
        // Equal scores = admin intentionally resetting the match to PENDING
        // so players can re-submit / re-upload. Works for all match types.
        const isDraw = score1 === score2;
        let winnerId: string | null = null;
        if (!isDraw) {
            winnerId = score1 > score2 ? match.player1Id : match.player2Id;
        }

        if (isDraw) {
            // RESET: clear result and send back to PENDING for players to re-submit
            await prisma.bracketMatch.update({
                where: { id: matchId },
                data: { score1: null, score2: null, winnerId: null, status: "PENDING" },
            });
            // Delete all existing BracketResults so players start fresh
            await prisma.bracketResult.deleteMany({ where: { bracketMatchId: matchId } });
            return SuccessResponse({ message: "Match reset to Pending. Players can now re-submit." });
        }

        // Update match scores + status
        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: { score1, score2, winnerId, status: "CONFIRMED" },
        });

        // Always upsert a BracketResult so the screenshot is reliably stored
        const adminPlayer = await prisma.player.findFirst({
            where: { user: { email: userId } },
            select: { id: true },
        });
        if (adminPlayer) {
            const existing = await prisma.bracketResult.findFirst({
                where: { bracketMatchId: matchId },
                orderBy: { createdAt: "desc" }, // desc = newest first, same as bracket API
            });
            if (existing) {
                await prisma.bracketResult.update({
                    where: { id: existing.id },
                    data: {
                        claimedScore1: score1,
                        claimedScore2: score2,
                        ...(screenshotUrl !== undefined ? { screenshotUrl } : {}),
                    },
                });
            } else {
                await prisma.bracketResult.create({
                    data: {
                        bracketMatchId: matchId,
                        submittedById: adminPlayer.id,
                        claimedScore1: score1,
                        claimedScore2: score2,
                        screenshotUrl: screenshotUrl ?? null,
                        isDispute: false,
                    },
                });
            }
        }

        // Advance winners for knockout matches
        const isKnockoutMatch =
            tournament?.type === "BRACKET_1V1" ||
            (tournament?.type === "GROUP_KNOCKOUT" && match.round > 0);

        if (isKnockoutMatch) {
            await advanceWinners(match.tournamentId, match.round);
        }

        return SuccessResponse({
            message: isKnockoutMatch
                ? "Score updated! Winner advances to next round."
                : "Score updated successfully.",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update match score", error });
    }
}
