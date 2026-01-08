/**
 * Characters that are invisible in BGMI (they render as spaces in-game)
 * Macron vowels: Ē Ī Ō Ū (and lowercase) - but NOT Ā/ā which we want to show
 * These characters should be replaced with spaces to match BGMI display
 */
const BGMI_INVISIBLE_CHARS = /[ĒēĪīŌōŪū]/g;

/**
 * Converts a displayName to how it appears in BGMI
 * Characters that are invisible in BGMI are replaced with spaces
 * Note: Ā/ā are preserved for better readability
 */
export function toBGMIDisplay(name: string | null | undefined): string {
    if (!name) return "";
    return name.replace(BGMI_INVISIBLE_CHARS, " ");
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
    return toBGMIDisplay(name);
}
