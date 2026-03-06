import { prisma } from "@/lib/database";
import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { type NextRequest } from "next/server";

const DISPUTE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/bracket-matches/[id]/submit-result
 * Winner submits score + optional screenshot.
 * Body: { score1: number, score2: number, screenshotUrl?: string }
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
        const { score1, score2, screenshotUrl, adminOverride } = body as {
            score1: number;
            score2: number;
            screenshotUrl?: string;
            adminOverride?: boolean;
        };

        if (score1 === undefined || score2 === undefined) {
            return ErrorResponse({ message: "score1 and score2 required", status: 400 });
        }

        // Get the user + role
        const user = await prisma.user.findUnique({
            where: { email: userId },
            select: {
                player: { select: { id: true } },
                role: true,
            },
        });
        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }
        const playerId = user.player.id;
        const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

        // Admin override check
        if (adminOverride && !isAdmin) {
            return ErrorResponse({ message: "Admin access required", status: 403 });
        }

        // Get the bracket match
        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                status: true,
                player1Id: true,
                player2Id: true,
                winnerId: true,
                tournamentId: true,
                round: true,
            },
        });

        if (!match) {
            return ErrorResponse({ message: "Match not found", status: 404 });
        }

        // Admin can override any status; players can only submit PENDING matches
        if (!adminOverride && match.status !== "PENDING") {
            return ErrorResponse({
                message: `Match is already ${match.status.toLowerCase()}`,
                status: 400,
            });
        }

        // Verify participant (skip for admin override)
        if (!adminOverride) {
            const isPlayer1 = match.player1Id === playerId;
            const isPlayer2 = match.player2Id === playerId;
            if (!isPlayer1 && !isPlayer2) {
                return ErrorResponse({
                    message: "You are not a participant in this match",
                    status: 403,
                });
            }
        }

        // Check tournament type to determine if draws are allowed
        const tournament = await prisma.tournament.findUnique({
            where: { id: match.tournamentId },
            select: { type: true },
        });
        const isLeague = tournament?.type === "LEAGUE";
        const isGroupStage = tournament?.type === "GROUP_KNOCKOUT" && match.round < 0;
        const drawsAllowed = isLeague || isGroupStage;

        // Determine winner from scores
        let claimedWinnerId: string | null = null;
        if (score1 === score2) {
            if (!drawsAllowed) {
                return ErrorResponse({
                    message: "Draws are not allowed — there must be a winner",
                    status: 400,
                });
            }
            claimedWinnerId = null;
        } else {
            claimedWinnerId = score1 > score2 ? match.player1Id : match.player2Id;
        }

        // Save the result submission
        await prisma.bracketResult.create({
            data: {
                bracketMatchId: matchId,
                submittedById: playerId,
                claimedScore1: score1,
                claimedScore2: score2,
                screenshotUrl: screenshotUrl || null,
                isDispute: false,
            },
        });

        // Admin override: auto-confirm immediately (no dispute window)
        if (adminOverride) {
            await prisma.bracketMatch.update({
                where: { id: matchId },
                data: {
                    score1,
                    score2,
                    winnerId: claimedWinnerId,
                    status: "CONFIRMED",
                },
            });

            // Advance winners for knockout matches
            const isKnockoutMatch =
                tournament?.type === "BRACKET_1V1" ||
                (tournament?.type === "GROUP_KNOCKOUT" && match.round > 0);

            if (isKnockoutMatch) {
                await advanceWinners(match.tournamentId, match.round);
            }

            return SuccessResponse({
                data: { matchId, score1, score2, winnerId: claimedWinnerId },
                message: isKnockoutMatch
                    ? "Result confirmed by admin! Winner advances."
                    : "Result confirmed by admin!",
            });
        }

        // Normal player flow: SUBMITTED status with dispute window
        const disputeDeadline = new Date(Date.now() + DISPUTE_WINDOW_MS);

        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: {
                score1,
                score2,
                winnerId: claimedWinnerId,
                status: "SUBMITTED",
                disputeDeadline,
            },
        });

        return SuccessResponse({
            data: {
                matchId,
                score1,
                score2,
                winnerId: claimedWinnerId,
                disputeDeadline,
            },
            message: `Result submitted! Your opponent has ${DISPUTE_WINDOW_MS / 60000} minutes to dispute.`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to submit result", error });
    }
}

/**
 * PUT /api/bracket-matches/[id]/submit-result
 * Opponent confirms the result (or admin force-confirms).
 * This skips the dispute window and confirms immediately.
 */
export async function PUT(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthEmail();
        if (!userId) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const { id: matchId } = await params;

        const user = await prisma.user.findUnique({
            where: { email: userId },
            select: {
                player: { select: { id: true } },
                role: true,
            },
        });
        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                status: true,
                player1Id: true,
                player2Id: true,
                winnerId: true,
                tournamentId: true,
                round: true,
            },
        });

        if (!match) {
            return ErrorResponse({ message: "Match not found", status: 404 });
        }

        if (match.status !== "SUBMITTED") {
            return ErrorResponse({
                message: "Match must be in SUBMITTED state to confirm",
                status: 400,
            });
        }

        // Must be the OTHER player (the one who didn't submit) or an admin
        const playerId = user.player.id;
        const isAdmin = user.role === "SUPER_ADMIN";
        const isOpponent =
            (match.player1Id === playerId && match.winnerId !== playerId) ||
            (match.player2Id === playerId && match.winnerId !== playerId) ||
            (match.player1Id === playerId && match.winnerId === match.player2Id) ||
            (match.player2Id === playerId && match.winnerId === match.player1Id);

        if (!isAdmin && !isOpponent) {
            return ErrorResponse({
                message: "Only the opponent or an admin can confirm this result",
                status: 403,
            });
        }

        // Confirm the match
        await prisma.bracketMatch.update({
            where: { id: matchId },
            data: { status: "CONFIRMED" },
        });

        // Only advance winners for knockout-style matches
        // Skip for: League (all matches), Group+KO group stage (negative rounds)
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

        const msg = isKnockoutMatch
            ? "Result confirmed! Winner advances to next round."
            : "Result confirmed!";

        return SuccessResponse({ message: msg });
    } catch (error) {
        return ErrorResponse({ message: "Failed to confirm result", error });
    }
}
