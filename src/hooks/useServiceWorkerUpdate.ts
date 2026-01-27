"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to detect service worker updates and auto-reload.
 * 
 * This is the "pro" way to handle SW updates:
 * 1. workbox config has skipWaiting: true + clientsClaim: true
 * 2. New SW installs and immediately takes control of all tabs
 * 3. This hook detects the "controllerchange" event and reloads
 * 
 * Result: After deployment, all open tabs auto-refresh with new code.
 * No freezes, no stale cache issues.
 */
export function useServiceWorkerUpdate() {
    const isReloading = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // When new service worker takes control, reload immediately
        const handleControllerChange = () => {
            if (!isReloading.current) {
                isReloading.current = true;
                console.log("[SW] New service worker activated, reloading...");
                window.location.reload();
            }
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
