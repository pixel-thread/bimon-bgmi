import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * GET /api/tournaments/[id]/bracket
 * Returns the full bracket data for a tournament.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                type: true,
                fee: true,
                isWinnerDeclared: true,
            },
        });

        if (!tournament || tournament.type !== "BRACKET_1V1") {
            return ErrorResponse({ message: "Bracket tournament not found", status: 404 });
        }

        const matches = await prisma.bracketMatch.findMany({
            where: { tournamentId: id },
            select: {
                id: true,
                round: true,
                position: true,
                player1Id: true,
                player2Id: true,
                winnerId: true,
                score1: true,
                score2: true,
                status: true,
                disputeDeadline: true,
                player1: { select: { id: true, displayName: true, userId: true } },
                player2: { select: { id: true, displayName: true, userId: true } },
                winner: { select: { id: true, displayName: true } },
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
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: [{ round: "asc" }, { position: "asc" }],
        });

        // Get user avatars for all players
        const playerUserIds = new Set<string>();
        for (const m of matches) {
            if (m.player1?.userId) playerUserIds.add(m.player1.userId);
            if (m.player2?.userId) playerUserIds.add(m.player2.userId);
        }
        const users = await prisma.user.findMany({
            where: { id: { in: [...playerUserIds] } },
            select: { id: true, imageUrl: true },
        });
        const avatarMap = new Map(users.map((u) => [u.id, u.imageUrl]));

        // Group by round
        const totalRounds = matches.length > 0
            ? Math.max(...matches.map((m) => m.round))
            : 0;

        const rounds = [];
        for (let r = 1; r <= totalRounds; r++) {
            const roundMatches = matches
                .filter((m) => m.round === r)
                .map((m) => ({
                    ...m,
                    player1Avatar: m.player1?.userId ? avatarMap.get(m.player1.userId) ?? null : null,
                    player2Avatar: m.player2?.userId ? avatarMap.get(m.player2.userId) ?? null : null,
                }));

            const roundName = r === totalRounds
                ? "Final"
                : r === totalRounds - 1
                    ? "Semi-finals"
                    : r === totalRounds - 2
                        ? "Quarter-finals"
                        : `Round ${r}`;

            rounds.push({
                round: r,
                name: roundName,
                matches: roundMatches,
            });
        }

        return SuccessResponse({
            data: {
                tournament,
                rounds,
                totalRounds,
                totalMatches: matches.length,
            },
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch bracket", error });
    }
}
