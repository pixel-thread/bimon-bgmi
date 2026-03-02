"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Ordered list of swipeable tab routes for regular users.
 * Matches the mobile nav tab order exactly.
 */
const USER_ROUTES = ["/players", "/vote", "/wallet", "/profile"];

/**
 * Admin route prefix — when the user is an admin, dashboard is prepended
 * so they can swipe between Dashboard ↔ Players ↔ Vote ↔ Wallet ↔ Profile.
 */
const DASHBOARD_PREFIX = "/dashboard";

/** Minimum horizontal distance (px) to count as a swipe */
const MIN_SWIPE_DISTANCE = 80;

/** Maximum ratio of vertical/horizontal movement — prevents triggering during scroll */
const MAX_VERTICAL_RATIO = 0.75;

/**
 * Hook that enables Instagram-like swipe navigation between main tab pages.
 * - Swipe left  → next tab (right in the list)
 * - Swipe right → previous tab (left in the list)
 *
 * Uses View Transitions API for smooth slide animations where supported.
 * Only active on mobile (< lg breakpoint via matchMedia).
 * Does nothing if the current page isn't one of the swipeable routes.
 */
export function useSwipeNavigation(
    isAdmin = false,
    lastDashboardHref = "/dashboard"
) {
    const pathname = usePathname();
    const router = useRouter();

    /** Build the route list based on admin status */
    const routes = useMemo(() => {
        if (isAdmin) {
            return [lastDashboardHref, ...USER_ROUTES];
        }
        return USER_ROUTES;
    }, [isAdmin, lastDashboardHref]);

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const isSwiping = useRef(false);

    /** Find the index of the current route in the swipe list */
    const getCurrentIndex = useCallback(() => {
        return routes.findIndex((route) => {
            if (route.startsWith(DASHBOARD_PREFIX)) {
                return pathname.startsWith(DASHBOARD_PREFIX);
            }
            return pathname.startsWith(route);
        });
    }, [pathname, routes]);

    /** Navigate with View Transitions API for smooth slide */
    const navigateWithTransition = useCallback(
        (targetRoute: string, direction: "left" | "right") => {
            const navigate = () => router.push(targetRoute);

            // Use View Transitions API if available (Chrome 111+, Android Chrome)
            if (
                typeof document !== "undefined" &&
                "startViewTransition" in document
            ) {
                document.documentElement.dataset.swipeDirection = direction;
                (
                    document as unknown as {
                        startViewTransition: (cb: () => void) => void;
                    }
                ).startViewTransition(() => {
                    navigate();
                });
            } else {
                navigate();
            }
        },
        [router]
    );

    useEffect(() => {
        // Only enable on mobile
        const mq = window.matchMedia("(max-width: 1023px)");
        if (!mq.matches) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
            isSwiping.current = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStart.current) return;

            const touch = e.touches[0];
            const dx = touch.clientX - touchStart.current.x;
            const dy = Math.abs(touch.clientY - touchStart.current.y);

            if (dy > Math.abs(dx) * MAX_VERTICAL_RATIO) {
                touchStart.current = null;
                return;
            }

            if (Math.abs(dx) > 30) {
                isSwiping.current = true;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current || !isSwiping.current) {
                touchStart.current = null;
                return;
            }

            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStart.current.x;
            const dy = Math.abs(touch.clientY - touchStart.current.y);

            touchStart.current = null;
            isSwiping.current = false;

            if (Math.abs(dx) < MIN_SWIPE_DISTANCE) return;
            if (dy > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

            const currentIndex = getCurrentIndex();
            if (currentIndex === -1) return;

            let targetIndex: number;
            let direction: "left" | "right";
            if (dx < 0) {
                targetIndex = currentIndex + 1;
                direction = "left";
            } else {
                targetIndex = currentIndex - 1;
                direction = "right";
            }

            if (targetIndex < 0 || targetIndex >= routes.length) return;

            navigateWithTransition(routes[targetIndex], direction);
        };

        document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        document.addEventListener("touchmove", handleTouchMove, {
            passive: true,
        });
        document.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [getCurrentIndex, navigateWithTransition, routes]);
}
