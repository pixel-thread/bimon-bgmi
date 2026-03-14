import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getSettings } from "@/lib/settings";
import { advanceWinners } from "@/lib/logic/generateBracket";
import { advanceGroupToKnockout } from "@/lib/logic/generateGroupKnockout";

const CONFIRM_DEADLINE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Silently auto-confirm any SUBMITTED matches in a tournament
 * that the opponent has ignored for more than 30 minutes.
 * Called on every bracket page load — no admin needed.
 */
async function silentAutoConfirm(tournamentId: string, tournamentType: string) {
    try {
        const now = new Date();
        const settings = await getSettings();

        // 1. SUBMITTED > 30 min → confirm the claimed result
        const stale = await prisma.bracketMatch.findMany({
            where: { tournamentId, status: "SUBMITTED", updatedAt: { lt: new Date(now.getTime() - CONFIRM_DEADLINE_MS) } },
            select: {
                id: true, round: true, player1Id: true, player2Id: true,
                results: { orderBy: { createdAt: "desc" }, take: 1, select: { claimedScore1: true, claimedScore2: true } },
            },
        });
        for (const match of stale) {
            const latest = match.results[0];
            if (!latest) continue;
            const { claimedScore1: s1, claimedScore2: s2 } = latest;
            const winnerId = s1 > s2 ? match.player1Id : match.player2Id;
            if (!winnerId) continue;
            await prisma.bracketMatch.update({ where: { id: match.id }, data: { score1: s1, score2: s2, winnerId, status: "CONFIRMED" } });
            // Create a result record so the UI can show how the match was resolved
            await prisma.bracketResult.create({
                data: { bracketMatchId: match.id, submittedById: winnerId!, claimedScore1: s1, claimedScore2: s2, notes: "Auto-confirmed: opponent did not respond within 30 minutes" },
            }).catch(() => {});
            const isKO = tournamentType === "BRACKET_1V1" || (tournamentType === "GROUP_KNOCKOUT" && match.round > 0);
            if (isKO) await advanceWinners(tournamentId, match.round);
        }

        // 2. PENDING past play deadline → random winner (1-0)
        const pending = await prisma.bracketMatch.findMany({
            where: { tournamentId, status: "PENDING", player1Id: { not: null }, player2Id: { not: null } },
            select: { id: true, round: true, player1Id: true, player2Id: true, createdAt: true },
        });
        for (const match of pending) {
            const isKO = tournamentType === "BRACKET_1V1" || (tournamentType === "GROUP_KNOCKOUT" && match.round > 0);
            const deadlineHours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
            if (now < new Date(match.createdAt.getTime() + deadlineHours * 60 * 60 * 1000)) continue;
            const winnerId = Math.random() < 0.5 ? match.player1Id! : match.player2Id!;
            const winnerIsP1 = winnerId === match.player1Id;
            await prisma.bracketMatch.update({
                where: { id: match.id },
                data: { winnerId, score1: winnerIsP1 ? 1 : 0, score2: winnerIsP1 ? 0 : 1, status: "CONFIRMED" },
            });
            // Create a result record so the UI can show how the match was resolved
            await prisma.bracketResult.create({
                data: { bracketMatchId: match.id, submittedById: winnerId, claimedScore1: winnerIsP1 ? 1 : 0, claimedScore2: winnerIsP1 ? 0 : 1, notes: "Auto-forfeit: no result submitted, random winner selected" },
            }).catch(() => {});
            if (isKO) await advanceWinners(tournamentId, match.round);
        }
        // 3. GROUP_KNOCKOUT: if ALL group stage matches are now CONFIRMED
        //    (and none are DISPUTED), silently seed the knockout bracket.
        if (tournamentType === "GROUP_KNOCKOUT") {
            const blockingGroupMatches = await prisma.bracketMatch.count({
                where: {
                    tournamentId,
                    round: { lt: 0 },                         // group stage only
                    status: { not: "CONFIRMED" },             // anything unfinished
                },
            });
            if (blockingGroupMatches === 0) {
                // Check KO slots aren't already filled (idempotency)
                const koFilled = await prisma.bracketMatch.count({
                    where: { tournamentId, round: 1, player1Id: { not: null } },
                });
                if (koFilled === 0) {
                    await advanceGroupToKnockout(tournamentId).catch(() => {
                        // Swallow — DISPUTED or already advanced
                    });
                }
            }
        }
    } catch {
        // Silently swallow — never break the main response
    }
}


/**
 * GET /api/tournaments/[id]/bracket
 * Fetch bracket matches for a tournament, grouped by round.
 * Also returns deadline settings so the player UI can show countdowns.
 * Public — any authenticated user can view brackets.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [tournament, settings] = await Promise.all([
            prisma.tournament.findUnique({
                where: { id },
                select: { id: true, type: true, fee: true, maxPlacements: true },
            }),
            getSettings(),
        ]);

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

        // Auto-confirm any SUBMITTED matches that the opponent has ignored >30 min
        await silentAutoConfirm(id, tournament.type);

        const matches = await prisma.bracketMatch.findMany({
            where: { tournamentId: id },
            include: {
                player1: {
                    select: {
                        id: true,
                        displayName: true,
                        customProfileImageUrl: true,
                        user: { select: { imageUrl: true } },
                    },
                },
                player2: {
                    select: {
                        id: true,
                        displayName: true,
                        customProfileImageUrl: true,
                        user: { select: { imageUrl: true } },
                    },
                },
                winner: {
                    select: { id: true, displayName: true },
                },
                results: {
                    select: {
                        id: true,
                        submittedById: true,
                        claimedScore1: true,
                        claimedScore2: true,
                        screenshotUrl: true,
                        notes: true,
                        isDispute: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: [{ round: "asc" }, { position: "asc" }],
        });

        if (matches.length === 0) {
            return SuccessResponse({ data: { rounds: [], totalRounds: 0, totalPlayers: 0 } });
        }

        // Group by round
        const roundMap = new Map<number, typeof matches>();
        for (const m of matches) {
            const existing = roundMap.get(m.round) || [];
            existing.push(m);
            roundMap.set(m.round, existing);
        }

        const totalRounds = Math.max(...Array.from(roundMap.keys()));

        // Count unique players
        const playerIds = new Set<string>();
        for (const m of matches) {
            if (m.player1Id) playerIds.add(m.player1Id);
            if (m.player2Id) playerIds.add(m.player2Id);
        }

        // Generate round names
        function getRoundName(round: number, total: number, type: string): string {
            if (type === "LEAGUE") return `Match Day ${round}`;
            if (type === "GROUP_KNOCKOUT") return `Round ${round}`;
            if (round === total) return "Final";
            if (round === total - 1) return "Semi-Final";
            if (round === total - 2) return "Quarter-Final";
            return `Round ${round}`;
        }

        const serverNow = Date.now();
        const rounds = Array.from(roundMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([round, roundMatches]) => ({
                round,
                name: getRoundName(round, totalRounds, tournament.type),
                matches: roundMatches.map((m) => ({
                    id: m.id,
                    round: m.round,
                    position: m.position,
                    player1Id: m.player1Id,
                    player2Id: m.player2Id,
                    winnerId: m.winnerId,
                    score1: m.score1,
                    score2: m.score2,
                    status: m.status,
                    disputeDeadline: m.disputeDeadline,
                    disputeRemainingMs: m.disputeDeadline ? Math.max(0, new Date(m.disputeDeadline).getTime() - serverNow) : null,
                    createdAt: m.createdAt,          // for deadline countdown on /bracket
                    player1: m.player1
                        ? { displayName: m.player1.displayName }
                        : null,
                    player2: m.player2
                        ? { displayName: m.player2.displayName }
                        : null,
                    player1Avatar:
                        m.player1?.customProfileImageUrl ??
                        m.player1?.user?.imageUrl ??
                        null,
                    player2Avatar:
                        m.player2?.customProfileImageUrl ??
                        m.player2?.user?.imageUrl ??
                        null,
                    results: m.results,
                })),
            }));

        // Check if there's a final winner
        const finalMatch = matches.find((m) => m.round === totalRounds && m.winnerId);
        const winner = finalMatch?.winner
            ? { displayName: finalMatch.winner.displayName }
            : null;

        // Compute prize pool for bracket mode
        const donations = await prisma.prizePoolDonation.findMany({
            where: { tournamentId: id },
            select: { amount: true },
        });
        const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
        const entryFee = tournament.fee ?? 0;
        const prizePool = entryFee * playerIds.size + totalDonations;

        return SuccessResponse({
            data: {
                rounds,
                totalRounds,
                totalPlayers: playerIds.size,
                winner,
                entryFee,
                prizePool,
                maxPlacements: tournament.maxPlacements ?? 3,
                // Deadline settings — player UI shows countdown for PENDING matches
                deadlines: {
                    groupHours: settings.matchDeadlineGroupHours,
                    koHours: settings.matchDeadlineKOHours,
                },
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch bracket", error });
    }
}
