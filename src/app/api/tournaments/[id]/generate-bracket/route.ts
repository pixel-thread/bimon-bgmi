import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { generateBracket } from "@/lib/logic/generateBracket";
import { generateLeague } from "@/lib/logic/generateLeague";
import { generateGroupKnockout } from "@/lib/logic/generateGroupKnockout";
import { type NextRequest } from "next/server";
import { debitCentralWallet } from "@/lib/wallet-service";

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
 * Anti-collision seeding: reorder slots so that entries from the
 * same player are spread as far apart as possible in the bracket.
 * This minimizes same-player matchups in early rounds.
 */
function antiCollisionSeed(slots: { playerId: string; entryIndex: number }[]): typeof slots {
    // Group by player
    const groups = new Map<string, typeof slots>();
    for (const slot of slots) {
        if (!groups.has(slot.playerId)) groups.set(slot.playerId, []);
        groups.get(slot.playerId)!.push(slot);
    }

    // Sort groups by size (biggest first — spread them widest)
    const sortedGroups = [...groups.values()].sort((a, b) => b.length - a.length);

    // Place entries in interleaved positions
    const result: (typeof slots[0] | null)[] = new Array(slots.length).fill(null);
    for (const group of sortedGroups) {
        const spacing = Math.floor(slots.length / group.length);
        let placed = 0;
        for (const entry of group) {
            // Find the nearest open position from the ideal spot
            const idealPos = placed * spacing;
            let pos = idealPos;
            while (pos < result.length && result[pos] !== null) pos++;
            if (pos >= result.length) {
                // Wrap around and find first open slot
                pos = 0;
                while (pos < result.length && result[pos] !== null) pos++;
            }
            result[pos] = entry;
            placed++;
        }
    }

    return result.filter(Boolean) as typeof slots;
}

/**
 * POST /api/tournaments/[id]/generate-bracket
 * Generate matches from poll voters (FCFS).
 *
 * Supports:
 *   BRACKET_1V1    — Single elimination knockout
 *   LEAGUE         — Round-robin (everyone plays everyone)
 *   GROUP_KNOCKOUT — Groups of 4, round-robin → knockout
 *
 * Multi-entry (PES): players with voteCount > 1 are expanded into
 * separate slots with anti-collision seeding to avoid early matchups.
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
                fee: true,
                name: true,
                poll: {
                    select: {
                        id: true,
                        isActive: true,
                        votes: {
                            where: { vote: { in: ["IN", "SOLO"] } },
                            select: {
                                playerId: true,
                                createdAt: true,
                                voteCount: true,
                            },
                            orderBy: { createdAt: "asc" },
                        },
                        luckyVoterId: true,
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

        // Build voter list — expand multi-entry players into separate slots
        type VoterSlot = { playerId: string; entryIndex: number };
        const voterSlots: VoterSlot[] = [];
        for (const v of tournament.poll.votes) {
            for (let i = 0; i < v.voteCount; i++) {
                voterSlots.push({ playerId: v.playerId, entryIndex: i + 1 });
            }
        }

        if (voterSlots.length < 2) {
            return ErrorResponse({
                message: `Need at least 2 entries. Currently ${voterSlots.length} voted IN.`,
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

        // Apply anti-collision seeding for multi-entry players
        const seededSlots = antiCollisionSeed(voterSlots);
        const seededPlayerIds = seededSlots.map(s => s.playerId);

        // Check if multi-entry expansion happened (preserve anti-collision seeding)
        const hasMultiEntries = voterSlots.length > tournament.poll!.votes.length;

        // Dispatch to the right generator
        let result: any;
        let message: string;

        switch (tournament.type) {
            case "BRACKET_1V1": {
                const bracketSize = floorPow2(seededPlayerIds.length);
                const includedIds = seededPlayerIds.slice(0, bracketSize);
                const excludedCount = seededPlayerIds.length - bracketSize;

                result = await generateBracket(id, includedIds, { skipShuffle: hasMultiEntries });
                result.excludedCount = excludedCount;
                result.bracketSize = bracketSize;

                message = excludedCount > 0
                    ? `Knockout bracket generated! ${bracketSize} entries included, ${excludedCount} excluded (voted too late).`
                    : `Knockout bracket generated! ${bracketSize} entries, ${result.totalRounds} rounds.`;
                break;
            }

            case "LEAGUE": {
                result = await generateLeague(id, seededPlayerIds);
                const totalMatches = (seededPlayerIds.length * (seededPlayerIds.length - 1)) / 2;
                message = `League generated! ${seededPlayerIds.length} entries, ${totalMatches} matches across ${result.totalRounds} match days.`;
                break;
            }

            case "GROUP_KNOCKOUT": {
                if (seededPlayerIds.length < 4) {
                    return ErrorResponse({
                        message: `Need at least 4 entries for Group + Knockout. Currently ${seededPlayerIds.length}.`,
                        status: 400,
                    });
                }
                result = await generateGroupKnockout(id, seededPlayerIds);
                message = `Group + Knockout generated! ${result.numGroups} groups of ${result.groupSize}, then knockout (${result.knockoutPlayers} players).`;
                break;
            }

            default:
                return ErrorResponse({ message: "Unknown tournament type", status: 400 });
        }

        // Debit entry fees — charge entryFee × voteCount per player
        const entryFee = tournament.fee ?? 0;
        if (entryFee > 0) {
            const luckyVoterId = tournament.poll.luckyVoterId;

            // Build map: playerId → total entries
            const playerEntryMap = new Map<string, number>();
            for (const v of tournament.poll.votes) {
                playerEntryMap.set(v.playerId, v.voteCount);
            }

            const playerIds = [...playerEntryMap.keys()];
            const players = await prisma.player.findMany({
                where: { id: { in: playerIds } },
                select: { id: true, isUCExempt: true, user: { select: { email: true } } },
            });

            const playersToCharge = players.filter(
                (p) => !p.isUCExempt && p.id !== luckyVoterId
            );

            if (playersToCharge.length > 0) {
                const BATCH = 5;
                for (let i = 0; i < playersToCharge.length; i += BATCH) {
                    const batch = playersToCharge.slice(i, i + BATCH);
                    await Promise.all(
                        batch.map(async (p) => {
                            const email = p.user?.email;
                            const entries = playerEntryMap.get(p.id) ?? 1;
                            const totalFee = entryFee * entries;
                            if (email) {
                                try {
                                    await debitCentralWallet(
                                        email,
                                        totalFee,
                                        entries > 1
                                            ? `Entry fee for ${tournament.name} (${entries} entries)`
                                            : `Entry fee for ${tournament.name}`,
                                        "TOURNAMENT_ENTRY",
                                    );
                                } catch (err) {
                                    console.error(`[generate-bracket] Failed to debit ${p.id}:`, err);
                                }
                            }
                        })
                    );
                }
            }
        }

        return SuccessResponse({
            data: result,
            message,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to generate matches", error });
    }
}
