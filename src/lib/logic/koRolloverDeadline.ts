import { prisma } from "@/lib/database";

/**
 * Compute the rollover deadline (ms timestamp) for a KO match.
 *
 * Formula:  T0 + roundPos × koHours
 *   T0       = createdAt of the earliest KO match in this tournament
 *   roundPos = 1-based index of the match's round in the sorted unique KO round list
 *   koHours  = per-round budget (e.g. 24)
 *
 * This ensures unused time from earlier rounds rolls into later rounds,
 * giving the total KO stage a predictable duration.
 *
 * For non-KO matches (group / league), falls back to per-match deadline:
 *   match.createdAt + deadlineHours
 */

// In-memory cache: tournamentId → { t0, sortedRounds }
// Cleared every 60s to avoid stale data across cron runs
let _cache: Map<string, { t0: number; sortedRounds: number[]; ts: number }> = new Map();
const CACHE_TTL = 60_000;

export async function getKoRolloverDeadlineMs(
    tournamentId: string,
    matchRound: number,
    koHours: number,
): Promise<number> {
    const now = Date.now();
    let entry = _cache.get(tournamentId);

    if (!entry || now - entry.ts > CACHE_TTL) {
        // Fetch all KO matches for this tournament (round > 0)
        const koMatches = await prisma.bracketMatch.findMany({
            where: { tournamentId, round: { gt: 0 } },
            select: { round: true, createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        if (koMatches.length === 0) {
            // No KO matches → can't compute rollover
            return 0;
        }

        const t0 = koMatches[0].createdAt.getTime();
        const sortedRounds = [...new Set(koMatches.map(m => m.round))].sort((a, b) => a - b);

        entry = { t0, sortedRounds, ts: now };
        _cache.set(tournamentId, entry);
    }

    const roundPos = entry.sortedRounds.indexOf(matchRound) + 1;
    if (roundPos <= 0) {
        // Round not found in KO rounds — shouldn't happen, fallback
        return 0;
    }

    return entry.t0 + roundPos * koHours * 3600_000;
}

/**
 * Compute the match deadline as a ms timestamp.
 *  - KO matches: rollover formula
 *  - Group/league matches: per-match deadline (createdAt + hours)
 */
export async function getMatchDeadlineMs(
    tournamentId: string,
    tournamentType: string,
    matchRound: number,
    matchCreatedAt: Date,
    settings: { matchDeadlineKOHours: number; matchDeadlineGroupHours: number },
): Promise<number> {
    const isKO = tournamentType === "BRACKET_1V1" ||
        (tournamentType === "GROUP_KNOCKOUT" && matchRound > 0);

    if (isKO) {
        const rollover = await getKoRolloverDeadlineMs(tournamentId, matchRound, settings.matchDeadlineKOHours);
        if (rollover > 0) return rollover;
    }

    // Fallback: per-match deadline
    const hours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
    return matchCreatedAt.getTime() + hours * 3600_000;
}
