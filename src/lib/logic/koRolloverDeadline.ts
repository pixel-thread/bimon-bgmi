import { prisma } from "@/lib/database";
import {
    snapToCutoff,
    addPausedDays,
    isTodayPaused,
    getISTDayOfWeek,
} from "./deadline-utils";

// Re-export pure functions so existing imports keep working
export {
    snapToCutoff,
    addPausedDays,
    isTodayPaused,
    getISTDayOfWeek,
};

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

/** Force-invalidate cached deadlines after rebasing KO timestamps (e.g. group→KO transition) */
export function invalidateDeadlineCache(tournamentId: string) {
    _cache.delete(tournamentId);
}

export async function getKoRolloverDeadlineMs(
    tournamentId: string,
    matchRound: number,
    koHours: number,
    cutoffTime: string,
    pausedDays: number[] = [],
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
    // Extend deadline for paused days, then snap to cutoff
    const extended = addPausedDays(entry.t0, rawDeadline, pausedDays);
    return cutoffTime ? snapToCutoff(extended, cutoffTime, pausedDays) : extended;
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
    settings: {
        matchDeadlineKOHours: number;
        matchDeadlineGroupHours: number;
        deadlineCutoffTime?: string;
        deadlinePausedDays?: number[];
    },
): Promise<number> {
    const isKO = tournamentType === "BRACKET_1V1" ||
        (tournamentType === "GROUP_KNOCKOUT" && matchRound > 0);

    const cutoff = settings.deadlineCutoffTime || "";
    const paused = settings.deadlinePausedDays || [];

    if (isKO) {
        const rollover = await getKoRolloverDeadlineMs(tournamentId, matchRound, settings.matchDeadlineKOHours, cutoff, paused);
        if (rollover > 0) return rollover;
    }

    // Fallback: per-match deadline → extend for paused days → snap to cutoff
    const hours = isKO ? settings.matchDeadlineKOHours : settings.matchDeadlineGroupHours;
    const rawDeadline = matchCreatedAt.getTime() + hours * 3600_000;
    const extended = addPausedDays(matchCreatedAt.getTime(), rawDeadline, paused);
    return cutoff ? snapToCutoff(extended, cutoff, paused) : extended;
}
