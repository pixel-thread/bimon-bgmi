/**
 * Sanitize BGMI display names for rendering.
 * Macron vowels (ĀāĒēĪīŌōŪū) are invisible characters in BGMI —
 * they act as spacers in-game but render as visible glyphs on the web.
 * Replace them with spaces and collapse multiple spaces.
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
    if (!name) return "";
    return name
        .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
