import { prisma } from "@/lib/database";
import { requireAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/bracket-matches/deadline-check
 * Scans all PENDING matches across active tournaments.
 * If a match's deadline has passed and no one submitted, randomly picks a winner (1-0).
 * Run manually from the admin Operations dashboard — no Vercel cron required.
 */
export async function POST() {
    try {
        await requireAdmin();

        const settings = await getSettings();
        const now = new Date();

        // Fetch all PENDING matches for ACTIVE bracket tournaments
        const pendingMatches = await prisma.bracketMatch.findMany({
            where: {
                status: "PENDING",
                player1Id: { not: null },
                player2Id: { not: null },
                tournament: {
                    status: "ACTIVE",
                    type: { in: ["BRACKET_1V1", "LEAGUE", "GROUP_KNOCKOUT"] },
                },
            },
            select: {
                id: true,
                round: true,
                player1Id: true,
                player2Id: true,
                tournamentId: true,
                createdAt: true,
                tournament: { select: { type: true } },
            },
        });

        const resolved: string[] = [];
        const skipped: string[] = [];

        for (const match of pendingMatches) {
            // Determine deadline based on round type
            const isKnockoutRound =
                match.tournament.type === "BRACKET_1V1" ||
                (match.tournament.type === "GROUP_KNOCKOUT" && match.round > 0);

            const deadlineHours = isKnockoutRound
                ? settings.matchDeadlineKOHours
                : settings.matchDeadlineGroupHours;

            const deadline = new Date(match.createdAt.getTime() + deadlineHours * 60 * 60 * 1000);

            if (now < deadline) {
                skipped.push(match.id);
                continue; // Not expired yet
            }

            // Randomly pick a winner
            const winnerId = Math.random() < 0.5 ? match.player1Id! : match.player2Id!;
            const winnerIsP1 = winnerId === match.player1Id;

            await prisma.bracketMatch.update({
                where: { id: match.id },
                data: {
                    winnerId,
                    score1: winnerIsP1 ? 1 : 0,
                    score2: winnerIsP1 ? 0 : 1,
                    status: "CONFIRMED",
                },
            });

            // Advance for KO matches only
            if (isKnockoutRound) {
                await advanceWinners(match.tournamentId, match.round);
            }

            resolved.push(match.id);
        }

        return SuccessResponse({
            message: resolved.length > 0
                ? `Auto-resolved ${resolved.length} expired match${resolved.length > 1 ? "es" : ""}.`
                : "No expired matches found.",
            data: {
                resolved: resolved.length,
                skipped: skipped.length,
                resolvedIds: resolved,
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Deadline check failed", error });
    }
}
