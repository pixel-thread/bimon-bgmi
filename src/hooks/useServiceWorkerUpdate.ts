"use client";

import { useEffect, useRef } from "react";

// Constants for reload throttling
const RELOAD_STORAGE_KEY = "sw_reload_tracker";
const MAX_RELOADS = 3;
const RELOAD_WINDOW_MS = 30000; // 30 seconds
const STABILITY_RESET_MS = 60000; // 60 seconds of stability resets counter

interface ReloadTracker {
    count: number;
    firstReloadAt: number;
    lastReloadAt: number;
}

/**
 * Get reload tracker from localStorage
 */
function getReloadTracker(): ReloadTracker {
    try {
        const stored = localStorage.getItem(RELOAD_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("[SW] Failed to read reload tracker:", e);
    }
    return { count: 0, firstReloadAt: 0, lastReloadAt: 0 };
}

/**
 * Save reload tracker to localStorage
 */
function saveReloadTracker(tracker: ReloadTracker): void {
    try {
        localStorage.setItem(RELOAD_STORAGE_KEY, JSON.stringify(tracker));
    } catch (e) {
        console.warn("[SW] Failed to save reload tracker:", e);
    }
}

/**
 * Check if we should allow a reload based on throttling rules
 */
function shouldAllowReload(): boolean {
    const now = Date.now();
    const tracker = getReloadTracker();

    // If it's been more than STABILITY_RESET_MS since last reload, reset counter
    if (tracker.lastReloadAt && (now - tracker.lastReloadAt) > STABILITY_RESET_MS) {
        console.log("[SW] Reload counter reset after stability period");
        saveReloadTracker({ count: 0, firstReloadAt: 0, lastReloadAt: 0 });
        return true;
    }

    // If we haven't reloaded yet, allow it
    if (tracker.count === 0) {
        return true;
    }

    // Check if we're within the reload window
    const withinWindow = (now - tracker.firstReloadAt) < RELOAD_WINDOW_MS;

    if (withinWindow && tracker.count >= MAX_RELOADS) {
        console.error(
            `[SW] Reload blocked: ${tracker.count} reloads in ${Math.round((now - tracker.firstReloadAt) / 1000)}s. ` +
            `Possible infinite loop detected. Please clear cache and reload manually.`
        );
        return false;
    }

    return true;
}

/**
 * Record a reload attempt
 */
function recordReload(): void {
    const now = Date.now();
    const tracker = getReloadTracker();

    // If this is the first reload or we're outside the window, start fresh
    if (tracker.count === 0 || (now - tracker.firstReloadAt) > RELOAD_WINDOW_MS) {
        saveReloadTracker({
            count: 1,
            firstReloadAt: now,
            lastReloadAt: now,
        });
    } else {
        // Increment within the same window
        saveReloadTracker({
            ...tracker,
            count: tracker.count + 1,
            lastReloadAt: now,
        });
    }
}

/**
 * Hook to detect service worker updates and auto-reload with throttling.
 * 
 * This is the "pro" way to handle SW updates:
 * 1. workbox config has skipWaiting: true + clientsClaim: true
 * 2. New SW installs and immediately takes control of all tabs
 * 3. This hook detects the "controllerchange" event and reloads
 * 
 * SAFETY: Includes reload throttling to prevent infinite loops:
 * - Max 3 reloads per 30 seconds
 * - Counter resets after 60 seconds of stability
 * - Blocks reloads if threshold exceeded
 */
export function useServiceWorkerUpdate() {
    const isReloading = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // When new service worker takes control, reload with throttling
        const handleControllerChange = () => {
            if (isReloading.current) {
                return;
            }

            // Check if we should allow this reload
            if (!shouldAllowReload()) {
                console.error("[SW] Reload throttled. Please clear browser cache and reload manually.");
                // Show user-friendly error message
                if (typeof window !== "undefined") {
                    const message = document.createElement("div");
                    message.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #ef4444;
                        color: white;
                        padding: 16px 24px;
                        border-radius: 8px;
                        z-index: 9999;
                        font-family: system-ui, -apple-system, sans-serif;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    `;
                    message.innerHTML = `
                        <strong>Update Issue Detected</strong><br>
                        Please clear your browser cache and reload manually.
                    `;
                    document.body.appendChild(message);

                    // Auto-dismiss after 10 seconds
                    setTimeout(() => {
                        message.remove();
                    }, 10000);
                }
                return;
            }

            isReloading.current = true;
            recordReload();
            console.log("[SW] New service worker activated, reloading...");
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
        };
    }, []);
}

/**
 * Global handler for chunk loading errors.
 * When old cached JS tries to load chunks from a new deployment,
 * we catch the error and silently force reload.
 * 
 * SAFETY: Includes throttling to prevent reload loops.
 */
export function setupChunkErrorHandler() {
    if (typeof window === "undefined") return;

    let errorReloadCount = 0;
    const ERROR_RELOAD_LIMIT = 2;
    const ERROR_RESET_MS = 60000; // Reset counter after 60 seconds

    // Reset error counter after stability period
    const resetErrorCounter = () => {
        errorReloadCount = 0;
    };
    let resetTimer: NodeJS.Timeout | null = null;

    const handleError = (event: ErrorEvent) => {
        const message = event.message || "";
        const filename = event.filename || "";

        // Detect chunk loading errors AND importScripts errors
        const isChunkError =
            message.includes("Loading chunk") ||
            message.includes("Failed to fetch dynamically imported module") ||
            message.includes("ChunkLoadError") ||
            message.includes("importScripts") ||
            message.includes("didn't register its module") ||
            // Also catch "X is not defined" errors that happen with stale cache
            (message.includes("is not defined") && filename.includes("/_next/"));

        if (isChunkError) {
            // Check if we've exceeded error reload limit
            if (errorReloadCount >= ERROR_RELOAD_LIMIT) {
                console.error("[SW] Too many chunk errors, blocking reload. Please clear cache manually.");
                return;
            }

            console.warn("[SW] Chunk load error detected, reloading...");
            errorReloadCount++;

            // Reset counter after stability period
            if (resetTimer) clearTimeout(resetTimer);
            resetTimer = setTimeout(resetErrorCounter, ERROR_RESET_MS);

            // Clear all caches silently
            if ("caches" in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => caches.delete(name));
                });
            }

            // Unregister service worker to get fresh one
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((reg) => reg.unregister());
                });
            }

            // Reload silently
            window.location.reload();
        }
    };

    window.addEventListener("error", handleError);

    // Also handle unhandled promise rejections (for dynamic imports)
    const handleRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason?.message || String(event.reason || "");

        if (
            reason.includes("Failed to fetch") ||
            reason.includes("ChunkLoadError") ||
            reason.includes("dynamically imported module") ||
            reason.includes("importScripts") ||
            reason.includes("didn't register")
        ) {
            // Check if we've exceeded error reload limit
            if (errorReloadCount >= ERROR_RELOAD_LIMIT) {
                console.error("[SW] Too many promise rejections, blocking reload. Please clear cache manually.");
                return;
            }

            console.warn("[SW] Dynamic import error, reloading...");
            errorReloadCount++;

            // Reset counter after stability period
            if (resetTimer) clearTimeout(resetTimer);
            resetTimer = setTimeout(resetErrorCounter, ERROR_RESET_MS);

            if ("caches" in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => caches.delete(name));
                });
            }

            window.location.reload();
        }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    // Listen for FORCE_RELOAD message from service worker (fallback recovery)
    const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === "FORCE_RELOAD") {
            console.warn("[SW] Received FORCE_RELOAD from service worker");
            window.location.reload();
        }
    };

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleRejection);
        if (resetTimer) clearTimeout(resetTimer);
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.removeEventListener("message", handleSWMessage);
        }
    };
}
