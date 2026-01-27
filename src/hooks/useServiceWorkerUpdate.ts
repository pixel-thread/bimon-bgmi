"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to detect service worker updates and handle them silently.
 * 
 * When a new deployment happens:
 * 1. The new service worker installs in the background
 * 2. When user focuses the tab again, we check for updates
 * 3. If there's a waiting service worker, we activate it and reload silently
 * 
 * This prevents the "app freeze" bug without interrupting the user.
 */
export function useServiceWorkerUpdate() {
    const pendingUpdate = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // When new service worker takes control, reload silently
        const handleControllerChange = () => {
            // Only reload if we're not already reloading
            if (!pendingUpdate.current) {
                pendingUpdate.current = true;
                window.location.reload();
            }
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        // Check for waiting service worker and activate on focus
        const handleVisibilityChange = async () => {
            if (document.visibilityState !== "visible") return;

            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration?.waiting) {
                    // Tell the waiting service worker to take over
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }
            } catch {
                // Ignore errors
            }
        };

        // Check for updates when tab becomes visible
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Also check on initial mount (user might have opened a stale tab)
        const checkOnMount = async () => {
            try {
                const registration = await navigator.serviceWorker.getRegistration();

                // If there's already a waiting worker, activate on next focus
                if (registration?.waiting) {
                    // Mark that we have a pending update
                    pendingUpdate.current = false; // Reset so controller change triggers reload
                }

                // Listen for new service workers
                if (registration) {
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        newWorker?.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && registration.active) {
                                // New version installed, will activate on next focus
                                pendingUpdate.current = false;
                            }
                        });
                    });
                }
            } catch {
                // Ignore
            }
        };

        checkOnMount();

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);
}

/**
 * Global handler for chunk loading errors.
 * When old cached JS tries to load chunks from a new deployment,
 * we catch the error and silently force reload.
 */
export function setupChunkErrorHandler() {
    if (typeof window === "undefined") return;

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
            console.warn("[SW] Chunk load error detected, reloading...");

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
            console.warn("[SW] Dynamic import error, reloading...");

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
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.removeEventListener("message", handleSWMessage);
        }
    };
}
