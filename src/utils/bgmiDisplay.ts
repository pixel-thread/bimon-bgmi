/**
 * Converts a displayName for display
 * Previously replaced macron vowels (Ā, Ē, etc.) with spaces to match BGMI,
 * but now displays them as-is for better readability in the app
 */
export function toBGMIDisplay(name: string | null | undefined): string {
    if (!name) return "";
    return name; // Keep name as-is, including macron characters like Ā
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
