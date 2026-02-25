"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "pubgmi_last_route";

/** Routes that should NOT be remembered */
const IGNORED_PREFIXES = [
    "/sign-in",
    "/sign-up",
    "/sso-callback",
    "/onboarding",
    "/~offline",
];

/**
 * Silently tracks the current pathname and saves it to localStorage.
 * Used to restore the last-visited page when the PWA is reopened.
 */
export function RouteTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Don't save the landing page or auth/onboarding routes
        if (
            pathname === "/" ||
            IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
        ) {
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEY, pathname);
        } catch {
            // localStorage might be unavailable (private browsing, etc.)
        }
    }, [pathname]);

    return null;
}

/**
 * Read the last saved route from localStorage.
 * Returns null if none is saved.
 */
export function getLastRoute(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}
