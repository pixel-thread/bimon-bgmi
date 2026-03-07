import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getSettings } from "@/lib/settings";

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
                select: { id: true, type: true },
            }),
            getSettings(),
        ]);

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

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

        return SuccessResponse({
            data: {
                rounds,
                totalRounds,
                totalPlayers: playerIds.size,
                winner,
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
