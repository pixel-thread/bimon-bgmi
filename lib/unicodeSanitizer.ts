// lib/unicodeSanitizer.ts

// Default invisible/zero-width and formatting characters
// - Zero width space, non-joiner/joiner, LRM/RLM, Arabic mark, word joiner, BOM, soft hyphen, variation selectors
// - Also includes a broad range of combining marks U+0300–U+036F which can visually hide base letters
const DEFAULT_INVISIBLE_REGEX = /[\u200B-\u200F\u061C\u2060-\u2064\u2066-\u2069\uFEFF\u00AD\uFE00-\uFE0F\u0300-\u036F]/g;

// Custom characters to hide from display (treat as invisible). Includes U+012B LATIN SMALL LETTER I WITH MACRON (ī)
// Extend this list if more characters should be hidden from names.
// Hide common precomposed macron letters (ĀāĒēĪīŌōŪūȲȳ) and related confusables (dotless ı)
const CUSTOM_HIDDEN_CHARS_REGEX = /[\u0100\u0101\u0112\u0113\u012A\u012B\u014C\u014D\u016A\u016B\u0232\u0233\u0131\u00AF\u02C9]/g;

// Hide decomposed forms with COMBINING MACRON (U+0304) after ASCII vowels/consonant I
const DECOMPOSED_MACRON_REGEX = /([AEIOUYaeiouyI]\u0304)/g;

/**
 * Removes invisible and custom-hidden characters from a display name.
 * Keeps visible accented letters intact (e.g., Ś), but strips zero-widths
 * and any characters considered deceptive/invisible for display.
 */
export function sanitizeDisplayName(name: string): string {
  if (!name) return name;
  // Remove zero-widths, replace hidden ī (and decomposed form) with a space, then collapse spaces
  const sanitized = name
    .replace(DEFAULT_INVISIBLE_REGEX, "")
    .replace(CUSTOM_HIDDEN_CHARS_REGEX, " ")
    .replace(DECOMPOSED_MACRON_REGEX, " ")
    .normalize("NFC")
    .replace(/\s{2,}/g, " ")
    .trim();
  return sanitized;
}

/**
 * Returns a version of the string suitable for matching: normalize and lower-case.
 * Intended for case-insensitive Unicode-aware comparisons.
 */
export function toMatchKey(value: string): string {
  return (value || "").normalize("NFC").toLowerCase();
}


