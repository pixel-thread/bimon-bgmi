import { prisma } from "@/lib/database";

/**
 * Snap a ms timestamp forward to the next occurrence of `cutoffTime` (IST).
 *
 * @param ms       - raw deadline as UTC milliseconds
 * @param cutoff   - "HH:MM" string in IST (e.g. "05:30")
 * @returns        - UTC ms timestamp of the next cutoff time after `ms`
 */
export function snapToCutoff(ms: number, cutoff: string): number {
    // Parse cutoff "HH:MM" → IST hours/minutes → UTC offset
    const [hIST, mIST] = cutoff.split(":").map(Number);
    // IST = UTC + 5:30, so UTC hour = IST hour - 5, UTC minute = IST minute - 30
    const totalISTMinutes = hIST * 60 + mIST;
    const totalUTCMinutes = totalISTMinutes - 330; // subtract 5h30m
    // Handle wrapping (e.g. 05:30 IST = 00:00 UTC, 04:00 IST = 22:30 UTC prev day)
    const normalised = ((totalUTCMinutes % 1440) + 1440) % 1440;
    const utcH = Math.floor(normalised / 60);
    const utcM = normalised % 60;

    const candidate = new Date(ms);
    candidate.setUTCHours(utcH, utcM, 0, 0);
    // If we're already past this time today, move to tomorrow
    if (candidate.getTime() <= ms) {
        candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
    return candidate.getTime();
}

/**
 * Compute the rollover deadline (ms timestamp) for a KO match.
 *
 * Formula:  snapToCutoff( T0 + roundPos × koHours )
 *   T0       = createdAt of the earliest KO match in this tournament
 *   roundPos = 1-based index of the match's round in the sorted unique KO round list
 *   koHours  = per-round budget (e.g. 24)
 *
 * The final deadline is snapped forward to the configured cutoff time (IST).
 *
 * For non-KO matches (group / league), falls back to per-match deadline:
 *   snapToCutoff( match.createdAt + deadlineHours )
 */

// In-memory cache: tournamentId → { t0, sortedRounds }
// Cleared every 60s to avoid stale data across cron runs
let _cache: Map<string, { t0: number; sortedRounds: number[]; ts: number }> = new Map();
const CACHE_TTL = 60_000;

export async function getKoRolloverDeadlineMs(
    tournamentId: string,
    matchRound: number,
    koHours: number,
    cutoffTime: string,
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

    const rawDeadline = entry.t0 + roundPos * koHours * 3600_000;
    return cutoffTime ? snapToCutoff(rawDeadline, cutoffTime) : rawDeadline;
}

/**
 * Compute the match deadline as a ms timestamp.
 *  - KO matches: rollover formula → snap to cutoff
 *  - Group/league matches: per-match deadline → snap to cutoff
 */
export async function getMatchDeadlineMs(
    tournamentId: string,
    tournamentType: string,
    matchRound: number,
    matchCreatedAt: Date,
    settings: { matchDeadlineKOHours: number; matchDeadlineGroupHours: number; deadlineCutoffTime?: string },
): Promise<number> {
    const isKO = tournamentType === "BRACKET_1V1" ||
        (tournamentType === "GROUP_KNOCKOUT" && matchRound > 0);

    const cutoff = settings.deadlineCutoffTime || "";

    if (isKO) {
        const rollover = await getKoRolloverDeadlineMs(tournamentId, matchRound, settings.matchDeadlineKOHours, cutoff);
        if (rollover > 0) return rollover;
    }

    // Fallback: per-match deadline → snap to cutoff
    const hours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
    const rawDeadline = matchCreatedAt.getTime() + hours * 3600_000;
    return cutoff ? snapToCutoff(rawDeadline, cutoff) : rawDeadline;
}
