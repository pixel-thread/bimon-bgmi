"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const LAST_ROUTE_KEY = "pwa-last-route";
// Pages that should not be restored (e.g., auth callbacks, error pages)
const EXCLUDED_PATHS = ["/sign-in", "/sign-up", "/sso-callback", "/error"];

/**
 * RouteRestorer - Persists and restores the last visited route for PWA
 * 
 * When the PWA is reopened, this component checks if there's a saved route
 * and redirects the user to that route instead of always going to "/".
 */
export function RouteRestorer() {
    const pathname = usePathname();
    const router = useRouter();
    const hasRestoredRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    // Restore saved route on initial load (only once)
    useEffect(() => {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        // Only restore if we're on the root path (PWA start_url)
        if (pathname !== "/") {
            isInitialLoadRef.current = false;
            return;
        }

        // Check if running as installed PWA
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        if (!isStandalone) {
            isInitialLoadRef.current = false;
            return;
        }

        try {
            const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
            if (savedRoute && savedRoute !== "/" && !EXCLUDED_PATHS.some(p => savedRoute.startsWith(p))) {
                // Restore immediately - router is ready when this component mounts
                router.replace(savedRoute);
            }
        } catch (e) {
            console.error("Failed to restore route:", e);
        }

        isInitialLoadRef.current = false;
    }, [pathname, router]);

    // Save current route on navigation changes
    useEffect(() => {
        // Skip saving on initial load to avoid overwriting before restore
        if (isInitialLoadRef.current) return;

        // Don't save excluded paths
        if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) return;

        // Don't save the root path if we're restoring
        if (pathname === "/") return;

        try {
            localStorage.setItem(LAST_ROUTE_KEY, pathname);
        } catch (e) {
            console.error("Failed to save route:", e);
        }
    }, [pathname]);

    return null;
}
