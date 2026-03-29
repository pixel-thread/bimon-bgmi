import { prisma } from "@/lib/database";
import { invalidateDeadlineCache } from "@/lib/logic/koRolloverDeadline";

/**
 * Generate a Group + Knockout (World Cup style) tournament.
 *
 * Phase 1: Group Stage
 *   - Players divided into groups of 4 (or 3 if needed)
 *   - Round-robin within each group
 *   - Top 2 from each group advance to knockout
 *
 * Phase 2: Knockout Stage
 *   - Single elimination bracket from group winners/runners-up
 *   - Cross-group seeding: Group A 1st vs Group B 2nd, etc.
 *
 * We use `round` to differentiate phases:
 *   round -N to -1 = Group stage matches (negative rounds)
 *   round 1+ = Knockout stage matches
 *
 * And `position` encodes the group number for group stage matches.
 *
 * The knockout bracket is initially empty — it gets populated when
 * the admin confirms group results and advances top players.
 */

interface GroupMatch {
    tournamentId: string;
    round: number;
    position: number;
    player1Id: string;
    player2Id: string;
    winnerId: null;
    status: "PENDING";
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function generateGroupKnockout(tournamentId: string, playerIds: string[]) {
    if (playerIds.length < 4) {
        throw new Error("Need at least 4 players for group + knockout");
    }

    const shuffled = shuffle(playerIds);
    const totalPlayers = shuffled.length;

    // Determine number of groups: aim for groups of 4, min 3
    // For 16 players: 4 groups of 4
    // For 12 players: 4 groups of 3
    // For 8 players: 2 groups of 4
    // For 6 players: 2 groups of 3
    let groupSize = 4;
    let numGroups = Math.floor(totalPlayers / groupSize);
    if (numGroups < 2) {
        groupSize = 3;
        numGroups = Math.floor(totalPlayers / groupSize);
    }
    if (numGroups < 2) numGroups = 2;

    // Distribute players into groups
    const groups: string[][] = Array.from({ length: numGroups }, () => []);
    for (let i = 0; i < numGroups * groupSize && i < shuffled.length; i++) {
        groups[i % numGroups].push(shuffled[i]);
    }

    // Generate round-robin matches within each group
    const allMatches: GroupMatch[] = [];
    let globalPosition = 0;

    for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        // Round-robin within group
        // Use negative round numbers for group stage: -(g+1)*100 + matchIndex
        let matchInGroup = 0;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                matchInGroup++;
                allMatches.push({
                    tournamentId,
                    round: -(g + 1),      // Negative = group stage. -1 = Group A, -2 = Group B, etc.
                    position: globalPosition++,
                    player1Id: group[i],
                    player2Id: group[j],
                    winnerId: null,
                    status: "PENDING",
                });
            }
        }
    }

    // Create empty knockout bracket slots
    // Top 2 from each group = numGroups * 2 players in knockout
    const knockoutPlayers = numGroups * 2;
    const knockoutRounds = Math.ceil(Math.log2(knockoutPlayers));

    // Round 1 of knockout
    for (let i = 0; i < knockoutPlayers / 2; i++) {
        allMatches.push({
            tournamentId,
            round: 1,
            position: i,
            player1Id: null as any, // Filled after group stage
            player2Id: null as any,
            winnerId: null,
            status: "PENDING",
        });
    }

    // Subsequent knockout rounds
    for (let round = 2; round <= knockoutRounds; round++) {
        const matchesInRound = knockoutPlayers / Math.pow(2, round);
        for (let pos = 0; pos < matchesInRound; pos++) {
            allMatches.push({
                tournamentId,
                round,
                position: pos,
                player1Id: null as any,
                player2Id: null as any,
                winnerId: null,
                status: "PENDING",
            });
        }
    }

    // 3rd place match if knockout has ≥ 4 players
    if (knockoutRounds >= 2) {
        allMatches.push({
            tournamentId,
            round: knockoutRounds,
            position: 1,
            player1Id: null as any,
            player2Id: null as any,
            winnerId: null,
            status: "PENDING",
        });
    }

    // Create all matches in bulk
    const result = await prisma.bracketMatch.createMany({
        data: allMatches.map((m) => ({
            ...m,
            player1Id: m.player1Id || null,
            player2Id: m.player2Id || null,
        })),
    });

    // Save group compositions as tournament metadata
    await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
            taxPreviewCache: {
                groups: groups.map((g, i) => ({
                    name: String.fromCharCode(65 + i), // A, B, C, D...
                    players: g,
                })),
                groupSize,
                numGroups,
                knockoutPlayers,
                knockoutRounds,
            } as any,
        },
    });

    return {
        totalPlayers: shuffled.length,
        numGroups,
        groupSize,
        knockoutPlayers,
        knockoutRounds,
        groupMatches: allMatches.filter((m) => m.round < 0).length,
        knockoutSlots: allMatches.filter((m) => m.round > 0).length,
        matchesCreated: result.count,
        groups: groups.map((g, i) => ({
            name: String.fromCharCode(65 + i),
            players: g,
        })),
        format: "GROUP_KNOCKOUT",
    };
}

/**
 * Advance top 2 from each group to the knockout stage.
 * Called by admin after all group matches are confirmed.
 *
 * Seeding: Group A 1st vs Group B 2nd, Group B 1st vs Group A 2nd
 * (cross-group seeding like FIFA World Cup)
 */
export async function advanceGroupToKnockout(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { taxPreviewCache: true },
    });

    const meta = tournament?.taxPreviewCache as any;
    if (!meta?.groups) throw new Error("No group data found");

    // Get all group stage matches (negative rounds)
    const groupMatches = await prisma.bracketMatch.findMany({
        where: { tournamentId, round: { lt: 0 } },
        select: {
            round: true,
            player1Id: true,
            player2Id: true,
            score1: true,
            score2: true,
            winnerId: true,
            status: true,
        },
    });

    // Check all group matches are confirmed
    const unfinished = groupMatches.filter((m) => m.status !== "CONFIRMED");
    if (unfinished.length > 0) {
        throw new Error(`${unfinished.length} group matches not yet confirmed`);
    }

    // Calculate standings per group
    type Standing = {
        playerId: string;
        points: number;
        goalDiff: number;
        goalsFor: number;
    };

    const groupStandings: Standing[][] = [];

    for (let g = 0; g < meta.groups.length; g++) {
        const groupRound = -(g + 1);
        const matches = groupMatches.filter((m) => m.round === groupRound);
        const standings = new Map<string, Standing>();

        const getOrCreate = (id: string): Standing => {
            if (!standings.has(id)) {
                standings.set(id, { playerId: id, points: 0, goalDiff: 0, goalsFor: 0 });
            }
            return standings.get(id)!;
        };

        for (const m of matches) {
            if (!m.player1Id || !m.player2Id) continue;
            const p1 = getOrCreate(m.player1Id);
            const p2 = getOrCreate(m.player2Id);
            const s1 = m.score1 ?? 0;
            const s2 = m.score2 ?? 0;

            p1.goalsFor += s1;
            p2.goalsFor += s2;
            p1.goalDiff += s1 - s2;
            p2.goalDiff += s2 - s1;

            if (m.winnerId === m.player1Id) { p1.points += 3; }
            else if (m.winnerId === m.player2Id) { p2.points += 3; }
            else { p1.points += 1; p2.points += 1; }
        }

        const sorted = Array.from(standings.values()).sort((a, b) =>
            b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
        );

        groupStandings.push(sorted);
    }

    // Cross-group seeding for knockout
    // A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, etc.
    const knockoutMatches = await prisma.bracketMatch.findMany({
        where: { tournamentId, round: 1 },
        orderBy: { position: "asc" },
    });

    let matchIdx = 0;
    for (let i = 0; i < groupStandings.length; i += 2) {
        const groupA = groupStandings[i];
        const groupB = groupStandings[i + 1] ?? groupStandings[0]; // Fallback for odd groups

        // A1 vs B2
        if (knockoutMatches[matchIdx]) {
            await prisma.bracketMatch.update({
                where: { id: knockoutMatches[matchIdx].id },
                data: {
                    player1Id: groupA[0]?.playerId ?? null,
                    player2Id: groupB[1]?.playerId ?? null,
                    createdAt: new Date(), // Reset deadline start
                },
            });
            matchIdx++;
        }

        // B1 vs A2
        if (knockoutMatches[matchIdx]) {
            await prisma.bracketMatch.update({
                where: { id: knockoutMatches[matchIdx].id },
                data: {
                    player1Id: groupB[0]?.playerId ?? null,
                    player2Id: groupA[1]?.playerId ?? null,
                    createdAt: new Date(), // Reset deadline start
                },
            });
            matchIdx++;
        }
    }

    // CRITICAL: Rebase ALL remaining KO matches (round 2+) to now.
    // These empty slots were created at tournament creation time, so their
    // createdAt is days/weeks old. The rollover deadline formula uses t0
    // (earliest KO match createdAt) — if we don't reset these, the deadlines
    // are already expired and silentAutoConfirm will auto-forfeit every
    // match up the bracket chain in a single request.
    await prisma.bracketMatch.updateMany({
        where: {
            tournamentId,
            round: { gt: 1 },    // Round 2+ (semis, final, 3rd place)
            player1Id: null,     // Only empty slots (not yet filled)
        },
        data: { createdAt: new Date() },
    });

    // Invalidate the in-memory deadline cache so the rollover formula
    // recalculates t0 from the freshly rebased timestamps.
    invalidateDeadlineCache(tournamentId);

    return {
        groupStandings: groupStandings.map((gs, i) => ({
            group: String.fromCharCode(65 + i),
            standings: gs,
        })),
        knockoutMatchesFilled: matchIdx,
    };
}
