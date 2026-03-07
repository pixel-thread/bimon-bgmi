import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { generateBracket } from "@/lib/logic/generateBracket";
import { generateLeague } from "@/lib/logic/generateLeague";
import { generateGroupKnockout } from "@/lib/logic/generateGroupKnockout";
import { type NextRequest } from "next/server";

/**
 * Largest power of 2 ≤ n.
 * e.g. 17 → 16, 15 → 8, 8 → 8, 4 → 4, 3 → 2
 */
function floorPow2(n: number): number {
    if (n < 2) return 0;
    let p = 2;
    while (p * 2 <= n) p *= 2;
    return p;
}

/**
 * POST /api/tournaments/[id]/generate-bracket
 * Generate matches from poll voters (FCFS).
 *
 * Supports:
 *   BRACKET_1V1    — Single elimination knockout
 *   LEAGUE         — Round-robin (everyone plays everyone)
 *   GROUP_KNOCKOUT — Groups of 4, round-robin → knockout
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: {
                id: true,
                type: true,
                status: true,
                poll: {
                    select: {
                        id: true,
                        isActive: true,
                        votes: {
                            where: { vote: { in: ["IN", "SOLO"] } },
                            select: { playerId: true, createdAt: true },
                            orderBy: { createdAt: "asc" }, // FCFS — earliest votes first
                        },
                    },
                },
                bracketMatches: { select: { id: true }, take: 1 },
            },
        });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

        const VALID_TYPES = ["BRACKET_1V1", "LEAGUE", "GROUP_KNOCKOUT"];
        if (!VALID_TYPES.includes(tournament.type)) {
            return ErrorResponse({
                message: "This tournament type does not support match generation",
                status: 400,
            });
        }

        // Delete existing matches if any (allows regeneration)
        if (tournament.bracketMatches.length > 0) {
            await prisma.bracketMatch.deleteMany({
                where: { tournamentId: id },
            });
        }

        if (!tournament.poll) {
            return ErrorResponse({ message: "No poll found for this tournament", status: 400 });
        }

        const allVoterIds = tournament.poll.votes.map((v) => v.playerId);

        if (allVoterIds.length < 2) {
            return ErrorResponse({
                message: `Need at least 2 players. Currently ${allVoterIds.length} voted IN.`,
                status: 400,
            });
        }

        // Close the poll if still active
        if (tournament.poll.isActive) {
            await prisma.poll.update({
                where: { id: tournament.poll.id },
                data: { isActive: false },
            });
        }

        // Dispatch to the right generator
        let result: any;
        let message: string;

        switch (tournament.type) {
            case "BRACKET_1V1": {
                // FCFS: trim to nearest power of 2
                const bracketSize = floorPow2(allVoterIds.length);
                const includedIds = allVoterIds.slice(0, bracketSize);
                const excludedCount = allVoterIds.length - bracketSize;

                result = await generateBracket(id, includedIds);
                result.excludedCount = excludedCount;
                result.bracketSize = bracketSize;

                message = excludedCount > 0
                    ? `Knockout bracket generated! ${bracketSize} players included, ${excludedCount} excluded (voted too late).`
                    : `Knockout bracket generated! ${bracketSize} players, ${result.totalRounds} rounds.`;
                break;
            }

            case "LEAGUE": {
                // League: all voters play, no FCFS trimming needed
                result = await generateLeague(id, allVoterIds);
                const totalMatches = (allVoterIds.length * (allVoterIds.length - 1)) / 2;
                message = `League generated! ${allVoterIds.length} players, ${totalMatches} matches across ${result.totalRounds} match days.`;
                break;
            }

            case "GROUP_KNOCKOUT": {
                // Group+KO: minimum 4 players
                if (allVoterIds.length < 4) {
                    return ErrorResponse({
                        message: `Need at least 4 players for Group + Knockout. Currently ${allVoterIds.length}.`,
                        status: 400,
                    });
                }
                result = await generateGroupKnockout(id, allVoterIds);
                message = `Group + Knockout generated! ${result.numGroups} groups of ${result.groupSize}, then knockout (${result.knockoutPlayers} players).`;
                break;
            }

            default:
                return ErrorResponse({ message: "Unknown tournament type", status: 400 });
        }

        return SuccessResponse({
            data: result,
            message,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to generate matches", error });
    }
}
