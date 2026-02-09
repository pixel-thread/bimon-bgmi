"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ============================================================================
// Update-on-Navigation PWA Strategy
// ============================================================================
// Philosophy: Apply updates during natural navigation - feels seamless
// 1. New SW installs and takes control immediately (skipWaiting + clientsClaim)
// 2. controllerchange fires, but we DON'T reload immediately
// 3. We set a flag that an update is pending
// 4. On user's next navigation, we reload - blends with natural page change
// 5. User never notices the update happened
// ============================================================================

// Global flag to track if update is pending (survives re-renders)
let updatePending = false;

export function SilentPWAUpdater() {
    const pathname = usePathname();
    const isFirstRender = useRef(true);
    const previousPathname = useRef(pathname);

    // Listen for service worker controller change (new SW took control)
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const handleControllerChange = () => {
            console.log("[PWA] New service worker active - will reload on next navigation");
            updatePending = true;
            // Don't reload here - wait for navigation
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        // Check for updates periodically
        const checkForUpdates = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.update();
            } catch {
                // Ignore - likely offline
            }
        };

        // Check on mount
        checkForUpdates();

        // Check every 10 minutes
        const interval = setInterval(checkForUpdates, 10 * 60 * 1000);

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
            clearInterval(interval);
        };
    }, []);

    // When pathname changes (user navigates), check if update is pending
    useEffect(() => {
        // Skip first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousPathname.current = pathname;
            return;
        }

        // Only act if pathname actually changed
        if (previousPathname.current === pathname) {
            return;
        }
        previousPathname.current = pathname;

        // If update is pending, reload to get new code
        if (updatePending) {
            console.log("[PWA] Navigated - applying pending update via reload");
            updatePending = false;

            // Small delay to let Next.js router settle, then reload
            // The reload will load the new page with fresh code
            setTimeout(() => {
                window.location.reload();
            }, 50);
        }
    }, [pathname]);

    // No UI - completely invisible
    return null;
}

// ============================================================================
// Graceful Chunk Error Handler
// ============================================================================
// When stale cache causes chunk errors, handle gracefully:
// - Clear the problematic cache
// - Reload to get fresh code
// ============================================================================

export function setupGracefulErrorHandler() {
    if (typeof window === "undefined") return () => { };

    const RECOVERY_KEY = "pwa_chunk_recovery";
    let errorCount = 0;
    const MAX_ERRORS = 2;

    const hasRecentlyRecovered = () => {
        try {
            const last = localStorage.getItem(RECOVERY_KEY);
            if (last && Date.now() - parseInt(last, 10) < 30000) {
                return true;
            }
        } catch {
            // Ignore
        }
        return false;
    };

    const markRecovery = () => {
        try {
            localStorage.setItem(RECOVERY_KEY, Date.now().toString());
        } catch {
            // Ignore
        }
    };

    const handleChunkError = () => {
        if (hasRecentlyRecovered() || errorCount >= MAX_ERRORS) {
            console.debug("[PWA] Skipping recovery - already tried recently or exceeded limit");
            return;
        }

        errorCount++;
        console.debug("[PWA] Chunk error detected, clearing cache and reloading...");

        // Clear all caches then reload
        if ("caches" in window) {
            caches.keys().then((names) => {
                Promise.all(names.map((name) => caches.delete(name))).then(() => {
                    markRecovery();
                    location.reload();
                });
            });
        } else {
            markRecovery();
            location.reload();
        }
    };

    const errorHandler = (event: ErrorEvent) => {
        const msg = event.message || "";
        const file = event.filename || "";

        const isChunkError =
            msg.includes("Loading chunk") ||
            msg.includes("Failed to fetch dynamically imported") ||
            msg.includes("ChunkLoadError") ||
            (msg.includes("is not defined") && file.includes("/_next/"));

        if (isChunkError) {
            event.preventDefault();
            handleChunkError();
        }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
        const reason = event.reason?.message || String(event.reason || "");

        if (
            reason.includes("Failed to fetch") ||
            reason.includes("ChunkLoadError") ||
            reason.includes("dynamically imported")
        ) {
            event.preventDefault();
            handleChunkError();
        }
    };

    window.addEventListener("error", errorHandler, true);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
        window.removeEventListener("error", errorHandler, true);
        window.removeEventListener("unhandledrejection", rejectionHandler);
    };
}
