import { prisma } from "@/lib/database";
import { GAME } from "@/lib/game-config";

/**
 * Generate a single-elimination bracket for a 1v1 tournament.
 *
 * Bracket structure:
 *   Round 1 → ... → Semi-finals → Final round
 *   Final round has 2 matches:
 *     position 0 = Grand Final (semi-final winners)
 *     position 1 = 3rd Place Match (semi-final losers)
 *
 * Since we always pass in a power-of-2 count (FCFS trimming),
 * no BYEs are needed — every round 1 match has two real players.
 */

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function generateBracket(tournamentId: string, playerIds: string[]) {
    if (playerIds.length < 2) {
        throw new Error("Need at least 2 players for a bracket");
    }

    const shuffled = shuffle(playerIds);
    const bracketSize = shuffled.length; // Already a power of 2 from FCFS
    const totalRounds = Math.log2(bracketSize);
    const has3rdPlaceMatch = totalRounds >= 2; // ≥4 players

    // Build all match data
    const allMatches: {
        tournamentId: string;
        round: number;
        position: number;
        player1Id: string | null;
        player2Id: string | null;
        winnerId: string | null;
        status: "PENDING" | "BYE";
    }[] = [];

    // Round 1: pair up players (always exact pairs since power of 2)
    for (let i = 0; i < bracketSize; i += 2) {
        allMatches.push({
            tournamentId,
            round: 1,
            position: i / 2,
            player1Id: shuffled[i],
            player2Id: shuffled[i + 1],
            winnerId: null,
            status: "PENDING",
        });
    }

    // Create empty slots for subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);
        for (let pos = 0; pos < matchesInRound; pos++) {
            allMatches.push({
                tournamentId,
                round,
                position: pos,
                player1Id: null,
                player2Id: null,
                winnerId: null,
                status: "PENDING",
            });
        }
    }

    // Add 3rd place match at the final round (position 1)
    // Only for brackets with ≥ 4 players (≥ 2 rounds)
    if (has3rdPlaceMatch) {
        allMatches.push({
            tournamentId,
            round: totalRounds,
            position: 1, // Final is position 0, 3rd place is position 1
            player1Id: null,
            player2Id: null,
            winnerId: null,
            status: "PENDING",
        });
    }

    // Create all matches in bulk
    const result = await prisma.bracketMatch.createMany({
        data: allMatches,
    });

    return {
        totalPlayers: shuffled.length,
        bracketSize,
        totalRounds,
        numByes: 0,
        has3rdPlaceMatch,
        matchesCreated: result.count,
    };
}

/**
 * After a round is complete, advance winners to the next round.
 *
 * For semi-finals (round before final):
 *   - Winners → Final (position 0)
 *   - Losers → 3rd Place Match (position 1)
 *
 * For the final round: check if both Final and 3rd Place Match are done,
 * then auto-declare all placements.
 */
export async function advanceWinners(
    tournamentId: string,
    completedRound: number,
    allMatches?: { id: string; round: number; position: number; winnerId: string | null; player1Id: string | null; player2Id: string | null; status: string }[]
) {
    type MatchRow = { id: string; round: number; position: number; winnerId: string | null; player1Id: string | null; player2Id: string | null; status: string };

    // Get all matches if not provided
    const matches: MatchRow[] = allMatches ?? await prisma.bracketMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: "asc" }, { position: "asc" }],
    });

    const totalRounds = Math.max(...matches.map((m) => m.round));

    const completedMatches = matches
        .filter((m: MatchRow) => m.round === completedRound && m.winnerId)
        .sort((a: MatchRow, b: MatchRow) => a.position - b.position);

    const nextRoundMatches = matches
        .filter((m: MatchRow) => m.round === completedRound + 1)
        .sort((a: MatchRow, b: MatchRow) => a.position - b.position);

    // This was the final round — no auto-declare.
    // Admin will manually declare winners from the Operations dashboard.
    if (completedRound === totalRounds) {
        return;
    }

    // Check if this is the semi-final round (round before final)
    const isSemiRound = completedRound === totalRounds - 1;

    // Advance winners to next round (standard bracket logic)
    for (const match of completedMatches) {
        const nextPos = Math.floor(match.position / 2);
        const isPlayer1 = match.position % 2 === 0;
        // Final is always position 0
        const nextMatch = nextRoundMatches.find((m: MatchRow) => m.position === (isSemiRound ? 0 : nextPos));

        if (nextMatch && match.winnerId) {
            await prisma.bracketMatch.update({
                where: { id: nextMatch.id },
                data: {
                    ...(isPlayer1
                        ? { player1Id: match.winnerId }
                        : { player2Id: match.winnerId }),
                    // Reset createdAt so deadline starts from when players are assigned
                    createdAt: new Date(),
                },
            });
        }

        // Semi-final: also send LOSERS to 3rd place match (position 1)
        if (isSemiRound && match.winnerId && match.player1Id && match.player2Id) {
            const loserId = match.player1Id === match.winnerId
                ? match.player2Id
                : match.player1Id;

            const thirdPlaceMatch = nextRoundMatches.find((m: MatchRow) => m.position === 1);
            if (thirdPlaceMatch) {
                await prisma.bracketMatch.update({
                    where: { id: thirdPlaceMatch.id },
                    data: {
                        ...(isPlayer1
                            ? { player1Id: loserId }
                            : { player2Id: loserId }),
                        // Reset createdAt so 3rd place match gets a fresh deadline
                        createdAt: new Date(),
                    },
                });
            }
        }
    }
}

/**
 * Check if both Final and 3rd Place Match are confirmed.
 * If so, auto-declare all placements.
 */
async function tryAutoDeclare(
    tournamentId: string,
    matches: { id: string; round: number; position: number; winnerId: string | null; player1Id: string | null; player2Id: string | null; status: string }[],
) {
    const totalRounds = Math.max(...matches.map((m) => m.round));
    const finalRoundMatches = matches.filter((m) => m.round === totalRounds);

    const finalMatch = finalRoundMatches.find((m) => m.position === 0);
    const thirdPlaceMatch = finalRoundMatches.find((m) => m.position === 1);

    // Final must be confirmed
    if (!finalMatch?.winnerId || (finalMatch.status !== "CONFIRMED" && finalMatch.status !== "BYE")) return;

    // 3rd place match must also be confirmed (if it exists)
    if (thirdPlaceMatch && thirdPlaceMatch.player1Id && thirdPlaceMatch.player2Id) {
        if (!thirdPlaceMatch.winnerId || (thirdPlaceMatch.status !== "CONFIRMED" && thirdPlaceMatch.status !== "BYE")) return;
    }

    // All done! Auto-declare
    await autoDeclareWinner(tournamentId, finalMatch, thirdPlaceMatch);
}

/**
 * Auto-declare the bracket results when final + 3rd place match are done.
 *
 * Placements:
 *   1st = Final winner (champion)
 *   2nd = Final loser (runner-up)
 *   3rd = 3rd Place Match winner
 *   Refund = 3rd Place Match loser (gets entry fee back)
 *
 * Prize split:
 *   Org: 5% of total pool
 *   1st: 50% of player pool
 *   2nd: 30% of player pool
 *   3rd: 20% of player pool
 *   4th (3rd place loser): entry fee refund
 */
async function autoDeclareWinner(
    tournamentId: string,
    finalMatch: { winnerId: string | null; player1Id: string | null; player2Id: string | null },
    thirdPlaceMatch?: { winnerId: string | null; player1Id: string | null; player2Id: string | null } | null,
) {
    if (!finalMatch.winnerId) return;

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: {
            id: true,
            name: true,
            fee: true,
            isWinnerDeclared: true,
            poll: {
                select: {
                    votes: {
                        where: { vote: { in: ["IN", "SOLO"] } },
                        select: { playerId: true },
                    },
                },
            },
        },
    });

    if (!tournament || tournament.isWinnerDeclared) return;

    // Extract into non-nullable consts (TS doesn't narrow inside closures)
    const tName = tournament.name;
    const tFee = tournament.fee ?? 0;
    const tVotes = tournament.poll?.votes ?? [];

    const winnerId = finalMatch.winnerId;

    // 2nd place = final loser
    const secondPlaceId = finalMatch.player1Id === winnerId
        ? finalMatch.player2Id
        : finalMatch.player1Id;

    // 3rd place = 3rd place match winner
    const thirdPlaceId = thirdPlaceMatch?.winnerId ?? null;

    // 4th place = 3rd place match loser → gets refund
    let fourthPlaceId: string | null = null;
    if (thirdPlaceMatch?.winnerId && thirdPlaceMatch.player1Id && thirdPlaceMatch.player2Id) {
        fourthPlaceId = thirdPlaceMatch.player1Id === thirdPlaceMatch.winnerId
            ? thirdPlaceMatch.player2Id
            : thirdPlaceMatch.player1Id;
    }

    // Calculate prize pool
    const totalPlayers = tVotes.length;
    const entryFee = tFee;
    const prizePool = entryFee * totalPlayers;

    // Org gets 5%
    const ORG_CUT = 0.05;
    const orgAmount = Math.floor(prizePool * ORG_CUT);

    // Refund for 4th place (entry fee back)
    const refundAmount = fourthPlaceId ? entryFee : 0;

    // Player pool = total - org - refund
    const playerPool = prizePool - orgAmount - refundAmount;

    // Split among top 3
    let prize1st: number, prize2nd: number, prize3rd: number;
    if (thirdPlaceId) {
        // Have 3rd place match: 50/30/20
        prize1st = Math.floor(playerPool * 0.50);
        prize2nd = Math.floor(playerPool * 0.30);
        prize3rd = playerPool - prize1st - prize2nd; // Remaining (avoids rounding issues)
    } else if (secondPlaceId) {
        // No 3rd place (2-player bracket): 70/30
        prize1st = Math.floor(playerPool * 0.70);
        prize2nd = playerPool - prize1st;
        prize3rd = 0;
    } else {
        // Edge case: only 1 match
        prize1st = playerPool;
        prize2nd = 0;
        prize3rd = 0;
    }

    // Gather all player IDs
    const allPlayerIds = [winnerId, secondPlaceId, thirdPlaceId, fourthPlaceId].filter(Boolean) as string[];
    const players = await prisma.player.findMany({
        where: { id: { in: allPlayerIds } },
        select: { id: true, userId: true, displayName: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    await prisma.$transaction(async (tx) => {
        // Helper: create team + winner + reward + notification
        async function createPlacement(
            playerId: string,
            position: number,
            amount: number,
            title: string,
            emoji: string,
        ) {
            const player = playerMap.get(playerId);
            if (!player || amount <= 0) return;

            let team = await tx.team.findFirst({
                where: { tournamentId, players: { some: { id: playerId } } },
            });
            if (!team) {
                const existingTeams = await tx.team.count({ where: { tournamentId } });
                team = await tx.team.create({
                    data: {
                        name: `Bracket-${position}`,
                        teamNumber: existingTeams + 1,
                        tournamentId,
                        players: { connect: { id: playerId } },
                    },
                });
            }

            await tx.tournamentWinner.create({
                data: {
                    amount,
                    position,
                    team: { connect: { id: team.id } },
                    tournament: { connect: { id: tournamentId } },
                    isDistributed: true,
                },
            });

            await tx.pendingReward.create({
                data: {
                    playerId,
                    type: "WINNER",
                    amount,
                    position,
                    message: `${emoji} ${title} — ${tName}`,
                    details: {
                        tournamentId,
                        tournamentName: tName,
                        prizePool,
                        totalPlayers,
                        position,
                    } as any,
                },
            });

            await tx.notification.create({
                data: {
                    userId: player.userId,
                    playerId,
                    title: `${emoji} ${title}!`,
                    message: `You earned ${amount} ${GAME.currency} in ${tName}! Tap to claim.`,
                    type: "tournament",
                    link: "/notifications",
                },
            });
        }

        // 1st place
        await createPlacement(winnerId, 1, prize1st, "Champion", "🏆");

        // 2nd place
        if (secondPlaceId) {
            await createPlacement(secondPlaceId, 2, prize2nd, "Runner-up", "🥈");
        }

        // 3rd place
        if (thirdPlaceId) {
            await createPlacement(thirdPlaceId, 3, prize3rd, "3rd Place", "🥉");
        }

        // 4th place (refund entry fee)
        if (fourthPlaceId && refundAmount > 0) {
            const player = playerMap.get(fourthPlaceId);
            if (player) {
                await tx.pendingReward.create({
                    data: {
                        playerId: fourthPlaceId,
                        type: "WINNER",
                        amount: refundAmount,
                        position: 4,
                        message: `💰 Entry fee refund — ${tName}`,
                        details: {
                            tournamentId,
                            tournamentName: tName,
                            type: "refund",
                            originalEntryFee: entryFee,
                        } as any,
                    },
                });

                await tx.notification.create({
                    data: {
                        userId: player.userId,
                        playerId: fourthPlaceId,
                        title: "💰 Entry Fee Refunded!",
                        message: `You got ${refundAmount} ${GAME.currency} back from ${tName}. Better luck next time!`,
                        type: "tournament",
                        link: "/notifications",
                    },
                });
            }
        }

        // Income record for org
        if (orgAmount > 0) {
            await tx.income.create({
                data: {
                    amount: orgAmount,
                    description: `Org (5%) — ${tName} (1v1 Bracket)`,
                    tournamentId,
                    tournamentName: tName,
                    createdBy: "system",
                },
            });
        }

        // Mark tournament as completed
        await tx.tournament.update({
            where: { id: tournamentId },
            data: { isWinnerDeclared: true, status: "INACTIVE" },
        });
    });

    const w = playerMap.get(winnerId);
    console.log(`[Bracket] Auto-declared: 1st=${w?.displayName}(${prize1st}), 2nd=${prize2nd}, 3rd=${prize3rd}, 4th=refund(${refundAmount}) | Org=${orgAmount} | Pool=${prizePool}`);
}
