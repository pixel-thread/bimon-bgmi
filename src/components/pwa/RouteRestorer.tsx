"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const LAST_ROUTE_KEY = "pwa-last-route";
// Pages that should not be restored (e.g., auth callbacks, error pages)
const EXCLUDED_PATHS = ["/sign-in", "/sign-up", "/sso-callback", "/error"];

type RouteRestorerContextType = {
    isRestoring: boolean;
    isPWA: boolean;
};

const RouteRestorerContext = createContext<RouteRestorerContextType>({
    isRestoring: false,
    isPWA: false,
});

export const useRouteRestorer = () => useContext(RouteRestorerContext);

/**
 * RouteRestorerProvider - Provides route restoration state to children
 * 
 * This allows components (especially the home page) to know if a restoration
 * is in progress and avoid rendering content that would flash.
 */
export function RouteRestorerProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isRestoring, setIsRestoring] = useState(false);
    const [isPWA, setIsPWA] = useState(false);
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        // Check if running as installed PWA
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        setIsPWA(isStandalone);

        // If not PWA or not on root path, no restoration needed
        if (!isStandalone || pathname !== "/") {
            return;
        }

        // If offline, skip restoration - navigating to uncached pages will fail
        if (!navigator.onLine) {
            console.log("PWA: Offline - skipping route restoration");
            return;
        }

        try {
            const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
            if (savedRoute && savedRoute !== "/" && !EXCLUDED_PATHS.some(p => savedRoute.startsWith(p))) {
                // Set restoring state and navigate
                setIsRestoring(true);
                router.replace(savedRoute);

                // Safety timeout - if navigation takes too long (e.g., offline), 
                // allow the page to render after 2 seconds
                setTimeout(() => {
                    setIsRestoring(false);
                }, 2000);
            }
            // If no saved route, isRestoring stays false
        } catch (e) {
            console.error("Failed to restore route:", e);
            setIsRestoring(false);
        }
    }, [pathname, router]);

    // Save current route on navigation changes
    useEffect(() => {
        // Don't save excluded paths
        if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) return;

        // Don't save the root path
        if (pathname === "/") return;

        try {
            localStorage.setItem(LAST_ROUTE_KEY, pathname);
        } catch (e) {
            console.error("Failed to save route:", e);
        }
    }, [pathname]);

    return (
        <RouteRestorerContext.Provider value={{ isRestoring, isPWA }}>
            {children}
        </RouteRestorerContext.Provider>
    );
}
