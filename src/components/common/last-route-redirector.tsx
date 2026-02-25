"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "pubgmi_last_route";

/**
 * On mount, checks localStorage for a previously saved route.
 * If one exists, redirects there immediately (replaces the history entry).
 * This should be placed on the landing/home page so returning
 * PWA users are taken straight to where they left off.
 */
export function LastRouteRedirector() {
    const router = useRouter();

    useEffect(() => {
        try {
            const lastRoute = localStorage.getItem(STORAGE_KEY);
            if (lastRoute && lastRoute !== "/") {
                router.replace(lastRoute);
            }
        } catch {
            // localStorage unavailable — do nothing
        }
    }, [router]);

    return null;
}
