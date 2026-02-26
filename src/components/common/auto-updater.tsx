"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";

/**
 * AutoUpdater — detects new deployments via service worker updates
 * and triggers a seamless reload on the next page navigation.
 *
 * How it works:
 * 1. After the page loads, we register a listener on the SW registration
 * 2. When a new SW is found (new deployment), we set a flag
 * 3. On the next client-side navigation the page reloads to pick up the new version
 *
 * This is the same pattern used by Vercel, GitHub, Slack, etc.
 */
export function AutoUpdater() {
    const pathname = usePathname();
    const updatePending = useRef(false);
    const isFirstRender = useRef(true);

    // Listen for service worker updates (new deployment detected)
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const checkForUpdate = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Check for updates periodically (every 60s)
                // Vercel/Next.js will have a new SW build hash after each deployment
                registration.update();

                // A new SW was found and installed — mark update as pending
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // The new SW is installed and waiting (or already activated via skipWaiting)
                        if (
                            newWorker.state === "installed" ||
                            newWorker.state === "activated"
                        ) {
                            // Only flag if there was a previous controller (not first install)
                            if (navigator.serviceWorker.controller) {
                                updatePending.current = true;
                                console.log(
                                    "[AutoUpdater] New version detected — will reload on next navigation"
                                );
                            }
                        }
                    });
                });
            } catch {
                // SW registration not available
            }
        };

        checkForUpdate();

        // Also periodically check for new deployments (every 5 minutes)
        const interval = setInterval(async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                registration.update();
            } catch {
                // Silently fail
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Also listen for the controlling SW change event
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const onControllerChange = () => {
            // A new SW has taken control — flag for reload on next navigation
            updatePending.current = true;
            console.log(
                "[AutoUpdater] Controller changed — will reload on next navigation"
            );
        };

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            onControllerChange
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                onControllerChange
            );
        };
    }, []);

    // On navigation: if an update is pending, do a hard reload
    useEffect(() => {
        // Skip the first render (initial page load)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (updatePending.current) {
            console.log(
                "[AutoUpdater] Navigated to",
                pathname,
                "— reloading for new version"
            );
            // Small delay so the navigation visually starts before we reload
            window.location.reload();
        }
    }, [pathname]);

    return null;
}
