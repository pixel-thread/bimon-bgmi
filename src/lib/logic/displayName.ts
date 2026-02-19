/**
 * Characters that are invisible in BGMI (they render as spaces in-game)
 * Macron vowels: Ē Ī Ō Ū (and lowercase) - but NOT Ā/ā which we want to show
 * These characters should be replaced with spaces to match BGMI display
 */
const BGMI_INVISIBLE_CHARS = /[ĒēĪīŌōŪū]/g;

/**
 * Sanitizes a display name by replacing invisible BGMI characters with spaces
 * Multiple consecutive spaces are collapsed to single space
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
    if (!name) return "";
    return name.replace(BGMI_INVISIBLE_CHARS, " ").replace(/\s+/g, " ").trim();
}

/**
 * Gets the display name with BGMI normalization
 * Falls back to userName if displayName is not set
 */
export function getDisplayName(
    displayName: string | null | undefined,
    userName: string | null | undefined
): string {
    const name = displayName || userName || "";
    return sanitizeDisplayName(name);
}
