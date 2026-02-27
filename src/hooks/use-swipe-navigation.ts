"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Ordered list of swipeable tab routes for regular users.
 * Matches the mobile nav tab order exactly.
 */
const USER_ROUTES = ["/players", "/vote", "/refer", "/wallet", "/profile"];

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
 * Only active on mobile (< lg breakpoint via matchMedia).
 * Does nothing if the current page isn't one of the swipeable routes.
 *
 * @param isAdmin — if true, includes "/dashboard" as the first swipeable tab.
 * @param lastDashboardHref — the specific dashboard sub-route to navigate to
 *   (e.g. "/dashboard/tournaments") so admins return to their last dashboard page.
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
        // For dashboard routes, match if the pathname starts with /dashboard
        return routes.findIndex((route) => {
            if (route.startsWith(DASHBOARD_PREFIX)) {
                return pathname.startsWith(DASHBOARD_PREFIX);
            }
            return pathname.startsWith(route);
        });
    }, [pathname, routes]);

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

            // If vertical movement dominates, cancel the swipe
            if (dy > Math.abs(dx) * MAX_VERTICAL_RATIO) {
                touchStart.current = null;
                return;
            }

            // Mark that we've started a horizontal swipe
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

            // Validate the swipe
            if (Math.abs(dx) < MIN_SWIPE_DISTANCE) return;
            if (dy > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

            const currentIndex = getCurrentIndex();
            if (currentIndex === -1) return; // Not on a swipeable page

            let targetIndex: number;
            if (dx < 0) {
                // Swipe left → go to next tab
                targetIndex = currentIndex + 1;
            } else {
                // Swipe right → go to previous tab
                targetIndex = currentIndex - 1;
            }

            // Bounds check
            if (targetIndex < 0 || targetIndex >= routes.length) return;

            router.push(routes[targetIndex]);
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [getCurrentIndex, router, routes]);
}
