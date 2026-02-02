/**
 * Birthday utility functions for checking if a player's birthday
 * falls within ±1 day of the current date
 */

/**
 * Check if a date of birth falls within ±1 day of today (birthday window)
 * Compares only month and day (ignores year)
 * 
 * @param dateOfBirth - The user's date of birth
 * @param referenceDate - The date to check against (defaults to now)
 * @returns true if birthday is yesterday, today, or tomorrow
 */
export function isBirthdayWithinWindow(
    dateOfBirth: Date | string | null | undefined,
    referenceDate: Date = new Date()
): boolean {
    if (!dateOfBirth) return false;

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return false;

    const today = new Date(referenceDate);

    // Get month and day from DOB
    const dobMonth = dob.getMonth(); // 0-indexed
    const dobDay = dob.getDate();

    // Check yesterday, today, and tomorrow
    for (let offset = -1; offset <= 1; offset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + offset);

        const checkMonth = checkDate.getMonth();
        const checkDay = checkDate.getDate();

        if (dobMonth === checkMonth && dobDay === checkDay) {
            return true;
        }
    }

    return false;
}

/**
 * Get the birthday status for display purposes
 * @returns "today" | "yesterday" | "tomorrow" | null
 */
export function getBirthdayStatus(
    dateOfBirth: Date | string | null | undefined,
    referenceDate: Date = new Date()
): "today" | "yesterday" | "tomorrow" | null {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;

    const today = new Date(referenceDate);
    const dobMonth = dob.getMonth();
    const dobDay = dob.getDate();

    // Check today
    if (today.getMonth() === dobMonth && today.getDate() === dobDay) {
        return "today";
    }

    // Check yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (yesterday.getMonth() === dobMonth && yesterday.getDate() === dobDay) {
        return "yesterday";
    }

    // Check tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (tomorrow.getMonth() === dobMonth && tomorrow.getDate() === dobDay) {
        return "tomorrow";
    }

    return null;
}

/**
 * Format a birthday for display (e.g., "February 2")
 */
export function formatBirthday(dateOfBirth: Date | string | null | undefined): string | null {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;

    return dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
