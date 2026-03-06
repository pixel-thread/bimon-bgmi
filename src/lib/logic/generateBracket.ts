import { prisma } from "@/lib/database";

/**
 * Generate a single-elimination bracket for a 1v1 tournament.
 *
 * Takes shuffled player IDs and creates all bracket match slots:
 * - Round 1: pair players (with byes if not a power of 2)
 * - Subsequent rounds: empty slots that get filled as winners advance
 *
 * Example with 6 players (next power of 2 = 8):
 *   Round 1: [P1 vs P2] [P3 vs P4] [P5 vs P6] [P7 vs BYE]
 *            2 byes auto-advance, so only P5 needs round 1 bye
 *   Actually: 8 slots, 6 players → 2 byes
 */

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
}

export async function generateBracket(tournamentId: string, playerIds: string[]) {
    if (playerIds.length < 2) {
        throw new Error("Need at least 2 players for a bracket");
    }

    const shuffled = shuffle(playerIds);
    const bracketSize = nextPowerOf2(shuffled.length);
    const totalRounds = Math.log2(bracketSize);
    const numByes = bracketSize - shuffled.length;

    // Fill slots: real players first, then nulls for byes
    const slots: (string | null)[] = [];
    for (let i = 0; i < bracketSize; i++) {
        slots.push(i < shuffled.length ? shuffled[i] : null);
    }

    // Calculate total matches across all rounds
    // Round 1: bracketSize/2 matches, Round 2: bracketSize/4, ... Final: 1
    const allMatches: {
        tournamentId: string;
        round: number;
        position: number;
        player1Id: string | null;
        player2Id: string | null;
        winnerId: string | null;
        status: "PENDING" | "BYE";
    }[] = [];

    // Round 1: pair up players
    for (let i = 0; i < bracketSize; i += 2) {
        const p1 = slots[i];
        const p2 = slots[i + 1];
        const position = i / 2;

        const isBye = !p1 || !p2;
        const byeWinner = isBye ? (p1 || p2) : null;

        allMatches.push({
            tournamentId,
            round: 1,
            position,
            player1Id: p1,
            player2Id: p2,
            winnerId: byeWinner,
            status: isBye ? "BYE" : "PENDING",
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

    // Create all matches in a transaction
    const created = await prisma.$transaction(
        allMatches.map((m) =>
            prisma.bracketMatch.create({ data: m })
        )
    );

    // Advance bye winners to round 2
    const round1Byes = created.filter((m) => m.status === "BYE" && m.winnerId);
    if (round1Byes.length > 0) {
        await advanceWinners(tournamentId, 1, created);
    }

    return {
        totalPlayers: shuffled.length,
        bracketSize,
        totalRounds,
        numByes,
        matchesCreated: created.length,
    };
}

/**
 * After a round is complete (or has byes), advance winners to the next round.
 * Each pair of matches feeds into one match in the next round:
 *   Round N position 0 winner → Round N+1 position 0 player1
 *   Round N position 1 winner → Round N+1 position 0 player2
 *   Round N position 2 winner → Round N+1 position 1 player1
 *   etc.
 */
export async function advanceWinners(
    tournamentId: string,
    completedRound: number,
    allMatches?: { id: string; round: number; position: number; winnerId: string | null; status: string }[]
) {
    // Get all matches if not provided
    const matches = allMatches ?? await prisma.bracketMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: "asc" }, { position: "asc" }],
    });

    const completedMatches = matches
        .filter((m) => m.round === completedRound && m.winnerId)
        .sort((a, b) => a.position - b.position);

    const nextRoundMatches = matches
        .filter((m) => m.round === completedRound + 1)
        .sort((a, b) => a.position - b.position);

    if (nextRoundMatches.length === 0) return; // Final round, no advancement needed

    // Pair completed matches and fill next round
    for (const match of completedMatches) {
        const nextPos = Math.floor(match.position / 2);
        const isPlayer1 = match.position % 2 === 0;
        const nextMatch = nextRoundMatches.find((m) => m.position === nextPos);

        if (nextMatch && match.winnerId) {
            await prisma.bracketMatch.update({
                where: { id: nextMatch.id },
                data: isPlayer1
                    ? { player1Id: match.winnerId }
                    : { player2Id: match.winnerId },
            });
        }
    }

    // Check if any next-round match now has both players set — if one is a bye, auto-advance
    const updatedNextRound = await prisma.bracketMatch.findMany({
        where: { tournamentId, round: completedRound + 1 },
        orderBy: { position: "asc" },
    });

    // Check for single-player matches (opponent is null = bye)
    for (const nm of updatedNextRound) {
        if (nm.status === "PENDING" && nm.player1Id && !nm.player2Id) {
            // Check if this match SHOULD have a player2 (i.e., the feeder match is complete)
            const feederPos = nm.position * 2 + 1;
            const feeder = matches.find(
                (m) => m.round === completedRound && m.position === feederPos
            );
            if (feeder && feeder.winnerId) {
                // Feeder is done, player2 should be set — skip (handled above)
            } else if (!feeder) {
                // No feeder match exists = this is a bye at this round
                await prisma.bracketMatch.update({
                    where: { id: nm.id },
                    data: { winnerId: nm.player1Id, status: "BYE" },
                });
            }
        }
    }
}
