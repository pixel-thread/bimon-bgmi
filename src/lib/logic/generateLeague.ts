import { prisma } from "@/lib/database";

/**
 * Generate a round-robin league.
 *
 * Every player plays every other player exactly once.
 * N players → N×(N-1)/2 total matches.
 * All matches are "round 1" since there are no elimination rounds.
 *
 * Standings are determined by points:
 *   Win = 3 pts, Draw = 1 pt, Loss = 0 pts
 */
export async function generateLeague(tournamentId: string, playerIds: string[]) {
    if (playerIds.length < 2) {
        throw new Error("Need at least 2 players for a league");
    }

    // Generate all pairings (round-robin)
    const matches: {
        tournamentId: string;
        round: number;
        position: number;
        player1Id: string;
        player2Id: string;
        winnerId: null;
        status: "PENDING";
    }[] = [];

    // Split into match days (rounds) using circle method
    // For N players (pad to even if needed):
    //   N-1 rounds, each with N/2 matches
    const players = [...playerIds];
    const isOdd = players.length % 2 !== 0;
    if (isOdd) players.push("BYE"); // Dummy player for odd count

    const n = players.length;
    const totalRounds = n - 1;
    let position = 0;

    for (let round = 0; round < totalRounds; round++) {
        for (let i = 0; i < n / 2; i++) {
            const home = players[i];
            const away = players[n - 1 - i];

            // Skip BYE matches
            if (home === "BYE" || away === "BYE") continue;

            matches.push({
                tournamentId,
                round: round + 1,
                position: position++,
                player1Id: home,
                player2Id: away,
                winnerId: null,
                status: "PENDING",
            });
        }

        // Rotate players (fix first player, rotate rest)
        const last = players.pop()!;
        players.splice(1, 0, last);
    }

    // Create all matches
    const created = await prisma.$transaction(
        matches.map((m) =>
            prisma.bracketMatch.create({ data: m })
        )
    );

    return {
        totalPlayers: playerIds.length,
        totalRounds,
        matchesCreated: created.length,
        format: "LEAGUE",
    };
}

/**
 * Get league standings from completed matches.
 * Returns players sorted by points, then goal difference (score diff), then goals scored.
 */
export async function getLeagueStandings(tournamentId: string) {
    const matches = await prisma.bracketMatch.findMany({
        where: { tournamentId, status: "CONFIRMED" },
        select: {
            player1Id: true,
            player2Id: true,
            score1: true,
            score2: true,
            winnerId: true,
        },
    });

    type Standing = {
        playerId: string;
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDiff: number;
        points: number;
    };

    const standings = new Map<string, Standing>();

    const getOrCreate = (id: string): Standing => {
        if (!standings.has(id)) {
            standings.set(id, {
                playerId: id,
                played: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
            });
        }
        return standings.get(id)!;
    };

    for (const m of matches) {
        if (!m.player1Id || !m.player2Id) continue;
        const p1 = getOrCreate(m.player1Id);
        const p2 = getOrCreate(m.player2Id);
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;

        p1.played++;
        p2.played++;
        p1.goalsFor += s1;
        p1.goalsAgainst += s2;
        p2.goalsFor += s2;
        p2.goalsAgainst += s1;

        if (m.winnerId === m.player1Id) {
            p1.wins++; p1.points += 3;
            p2.losses++;
        } else if (m.winnerId === m.player2Id) {
            p2.wins++; p2.points += 3;
            p1.losses++;
        } else {
            // Draw
            p1.draws++; p1.points += 1;
            p2.draws++; p2.points += 1;
        }

        p1.goalDiff = p1.goalsFor - p1.goalsAgainst;
        p2.goalDiff = p2.goalsFor - p2.goalsAgainst;
    }

    // Sort: points DESC → goal diff DESC → goals for DESC
    return Array.from(standings.values()).sort((a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor
    );
}
