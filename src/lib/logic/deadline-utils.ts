/**
 * Pure deadline utility functions — safe for both client and server.
 * No database or server-only imports.
 */

const IST_OFFSET_MS = 5.5 * 3600_000; // +5:30

/**
 * Get the IST day-of-week (0=Sun … 6=Sat) for a UTC ms timestamp.
 */
export function getISTDayOfWeek(utcMs: number): number {
    return new Date(utcMs + IST_OFFSET_MS).getUTCDay();
}

/**
 * Check if "right now" is a paused day in IST.
 */
export function isTodayPaused(pausedDays: number[]): boolean {
    if (!pausedDays || pausedDays.length === 0) return false;
    return pausedDays.includes(getISTDayOfWeek(Date.now()));
}

/**
 * Count how many paused days (in IST) fall strictly between `startMs` and `endMs`,
 * then extend `endMs` by +24h per paused day. Iterates until stable because
 * extending the window may include additional paused days.
 */
export function addPausedDays(startMs: number, endMs: number, pausedDays: number[]): number {
    if (!pausedDays || pausedDays.length === 0) return endMs;

    let deadline = endMs;
    let prevDeadline = -1;

    // Iterate until stable (max 10 loops to avoid infinite)
    for (let i = 0; i < 10 && deadline !== prevDeadline; i++) {
        prevDeadline = deadline;

        // Walk day-by-day from start to current deadline, count paused days
        let pausedCount = 0;
        const startDate = new Date(startMs + IST_OFFSET_MS);
        startDate.setUTCHours(0, 0, 0, 0);
        const cursor = startDate.getTime() - IST_OFFSET_MS; // start of IST day in UTC

        for (let dayStart = cursor; dayStart < deadline; dayStart += 86400_000) {
            const istDay = getISTDayOfWeek(dayStart);
            if (pausedDays.includes(istDay)) pausedCount++;
        }

        deadline = endMs + pausedCount * 86400_000;
    }

    return deadline;
}

/**
 * Snap a ms timestamp forward to the next occurrence of `cutoffTime` (IST).
 * If that lands on a paused day, push forward to next non-paused day.
 *
 * @param ms         - raw deadline as UTC milliseconds
 * @param cutoff     - "HH:MM" string in IST (e.g. "05:30")
 * @param pausedDays - JS day numbers to skip (0=Sun)
 * @returns          - UTC ms timestamp of the next cutoff on a non-paused day
 */
export function snapToCutoff(ms: number, cutoff: string, pausedDays: number[] = []): number {
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

    // Skip paused days — push forward until we land on a non-paused day
    if (pausedDays && pausedDays.length > 0) {
        for (let i = 0; i < 7; i++) {
            if (!pausedDays.includes(getISTDayOfWeek(candidate.getTime()))) break;
            candidate.setUTCDate(candidate.getUTCDate() + 1);
        }
    }

    return candidate.getTime();
}
