import { prisma } from "@/lib/database";
import { requireAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/bracket-matches/deadline-check
 *
 * Two passes:
 *  1. PENDING matches past their play deadline  → random winner (1-0)
 *  2. SUBMITTED matches older than 30 min       → auto-confirm the claimed result
 *
 * Run from Operations dashboard OR automate with Vercel cron:
 *   vercel.json → { "crons": [{ "path": "/api/bracket-matches/deadline-check", "schedule": "0,15,30,45 * * * *" }] }
 */
export async function POST() {
    try {
        await requireAdmin();

        const settings = await getSettings();
        const now = new Date();
        const CONFIRM_DEADLINE_MS = 30 * 60 * 1000; // 30 minutes

        // ── 1. Auto-resolve PENDING matches past their play deadline ────────
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
                id: true, round: true, player1Id: true, player2Id: true,
                tournamentId: true, createdAt: true,
                tournament: { select: { type: true } },
            },
        });

        const resolved: string[] = [];
        const skipped: string[] = [];

        for (const match of pendingMatches) {
            const isKO = match.tournament.type === "BRACKET_1V1" ||
                (match.tournament.type === "GROUP_KNOCKOUT" && match.round > 0);
            const deadlineHours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
            const deadline = new Date(match.createdAt.getTime() + deadlineHours * 60 * 60 * 1000);

            if (now < deadline) { skipped.push(match.id); continue; }

            const winnerId = Math.random() < 0.5 ? match.player1Id! : match.player2Id!;
            const winnerIsP1 = winnerId === match.player1Id;

            await prisma.bracketMatch.update({
                where: { id: match.id },
                data: { winnerId, score1: winnerIsP1 ? 1 : 0, score2: winnerIsP1 ? 0 : 1, status: "CONFIRMED" },
            });
            await prisma.bracketResult.create({
                data: { bracketMatchId: match.id, submittedById: winnerId, claimedScore1: winnerIsP1 ? 1 : 0, claimedScore2: winnerIsP1 ? 0 : 1, notes: "Auto-forfeit: no result submitted, random winner selected" },
            }).catch(() => {});

            if (isKO) await advanceWinners(match.tournamentId, match.round);
            resolved.push(match.id);
        }

        // ── 2. Auto-confirm SUBMITTED matches (opponent silent > 30 min) ────
        //    Exception: walkover claims only auto-confirm when match deadline ≤ 30 min remaining
        const submittedMatches = await prisma.bracketMatch.findMany({
            where: {
                status: "SUBMITTED",
                tournament: {
                    status: "ACTIVE",
                    type: { in: ["BRACKET_1V1", "LEAGUE", "GROUP_KNOCKOUT"] },
                },
                // updatedAt is when the match moved to SUBMITTED
                updatedAt: { lt: new Date(now.getTime() - CONFIRM_DEADLINE_MS) },
            },
            select: {
                id: true, round: true, player1Id: true, player2Id: true, tournamentId: true,
                createdAt: true,
                tournament: { select: { type: true } },
                results: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { claimedScore1: true, claimedScore2: true, notes: true },
                },
            },
        });

        const autoConfirmed: string[] = [];

        for (const match of submittedMatches) {
            const latest = match.results[0];
            if (!latest) continue;

            // Check if this is a walkover claim
            const isWalkover = latest.notes?.toLowerCase().includes("walkover") ?? false;
            if (isWalkover) {
                const isKO = match.tournament.type === "BRACKET_1V1" ||
                    (match.tournament.type === "GROUP_KNOCKOUT" && match.round > 0);
                const deadlineHours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
                const matchDeadline = new Date(match.createdAt.getTime() + deadlineHours * 3600_000);
                const timeLeftMs = matchDeadline.getTime() - now.getTime();
                if (timeLeftMs > CONFIRM_DEADLINE_MS) continue; // Still has time — skip
            }

            const s1 = latest.claimedScore1;
            const s2 = latest.claimedScore2;
            const winnerId = s1 > s2 ? match.player1Id : match.player2Id;
            if (!winnerId) continue;

            await prisma.bracketMatch.update({
                where: { id: match.id },
                data: { score1: s1, score2: s2, winnerId, status: "CONFIRMED" },
            });
            await prisma.bracketResult.create({
                data: { bracketMatchId: match.id, submittedById: winnerId!, claimedScore1: s1, claimedScore2: s2, notes: isWalkover ? "Walkover confirmed: opponent did not respond before deadline" : "Auto-confirmed: opponent did not respond within 30 minutes" },
            }).catch(() => {});

            const isKO = match.tournament.type === "BRACKET_1V1" ||
                (match.tournament.type === "GROUP_KNOCKOUT" && match.round > 0);
            if (isKO) await advanceWinners(match.tournamentId, match.round);

            autoConfirmed.push(match.id);
        }

        const total = resolved.length + autoConfirmed.length;
        return SuccessResponse({
            message: total > 0
                ? `Auto-resolved ${resolved.length} expired + auto-confirmed ${autoConfirmed.length} submitted match${total !== 1 ? "es" : ""}.`
                : "No expired or overdue submitted matches found.",
            data: { resolved: resolved.length, autoConfirmed: autoConfirmed.length, skipped: skipped.length },
        });
    } catch (error) {
        return ErrorResponse({ message: "Deadline check failed", error });
    }
}
