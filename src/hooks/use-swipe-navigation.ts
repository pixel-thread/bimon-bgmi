"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Ordered list of swipeable tab routes for regular users.
 * Matches the mobile nav tab order exactly.
 */
const USER_ROUTES = ["/players", "/vote", "/wallet", "/profile"];

const DASHBOARD_PREFIX = "/dashboard";

/** Minimum horizontal distance (px) to trigger navigation */
const MIN_SWIPE_DISTANCE = 60;

/** Maximum ratio of vertical/horizontal movement */
const MAX_VERTICAL_RATIO = 0.75;

/** Max drag offset for visual feedback (px) */
const MAX_DRAG = 120;

/**
 * Hook that enables Instagram-like swipe navigation between main tab pages.
 * The page follows the finger during the swipe and slides on release.
 */
export function useSwipeNavigation(
    isAdmin = false,
    lastDashboardHref = "/dashboard"
) {
    const pathname = usePathname();
    const router = useRouter();

    const routes = useMemo(() => {
        if (isAdmin) {
            return [lastDashboardHref, ...USER_ROUTES];
        }
        return USER_ROUTES;
    }, [isAdmin, lastDashboardHref]);

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);
    const directionLocked = useRef<"horizontal" | "vertical" | null>(null);
    const mainEl = useRef<HTMLElement | null>(null);

    const getCurrentIndex = useCallback(() => {
        return routes.findIndex((route) => {
            if (route.startsWith(DASHBOARD_PREFIX)) {
                return pathname.startsWith(DASHBOARD_PREFIX);
            }
            return pathname.startsWith(route);
        });
    }, [pathname, routes]);

    /** Check if swiping in this direction is valid (not at edge) */
    const canSwipe = useCallback(
        (direction: "left" | "right") => {
            const idx = getCurrentIndex();
            if (idx === -1) return false;
            if (direction === "left") return idx < routes.length - 1;
            return idx > 0;
        },
        [getCurrentIndex, routes.length]
    );

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)");
        if (!mq.matches) return;

        // Find the main content element
        const findMain = () => {
            mainEl.current = document.querySelector("main");
        };
        findMain();

        const handleTouchStart = (e: TouchEvent) => {
            findMain();
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
            isDragging.current = false;
            directionLocked.current = null;

            if (mainEl.current) {
                mainEl.current.style.transition = "none";
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStart.current || !mainEl.current) return;

            const touch = e.touches[0];
            const dx = touch.clientX - touchStart.current.x;
            const dy = Math.abs(touch.clientY - touchStart.current.y);
            const absDx = Math.abs(dx);

            // Lock direction on first significant movement
            if (!directionLocked.current && (absDx > 10 || dy > 10)) {
                if (dy > absDx * MAX_VERTICAL_RATIO) {
                    directionLocked.current = "vertical";
                    touchStart.current = null;
                    return;
                }
                directionLocked.current = "horizontal";
            }

            if (directionLocked.current !== "horizontal") return;

            // Check if we can swipe in this direction
            const direction = dx < 0 ? "left" : "right";
            if (!canSwipe(direction)) {
                // Rubber-band effect at edges
                const rubber = Math.sign(dx) * Math.pow(absDx, 0.5) * 2;
                mainEl.current.style.transform = `translateX(${rubber}px)`;
                mainEl.current.style.opacity = "1";
                isDragging.current = true;
                return;
            }

            isDragging.current = true;

            // Clamp the drag offset
            const clampedDx = Math.sign(dx) * Math.min(absDx, MAX_DRAG);
            const progress = Math.min(absDx / MAX_DRAG, 1);
            const opacity = 1 - progress * 0.3;

            mainEl.current.style.transform = `translateX(${clampedDx}px)`;
            mainEl.current.style.opacity = `${opacity}`;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current || !isDragging.current || !mainEl.current) {
                // Reset
                if (mainEl.current) {
                    mainEl.current.style.transition = "";
                    mainEl.current.style.transform = "";
                    mainEl.current.style.opacity = "";
                }
                touchStart.current = null;
                isDragging.current = false;
                directionLocked.current = null;
                return;
            }

            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStart.current.x;
            const absDx = Math.abs(dx);

            touchStart.current = null;
            isDragging.current = false;
            directionLocked.current = null;

            const direction = dx < 0 ? "left" : "right";
            const shouldNavigate = absDx >= MIN_SWIPE_DISTANCE && canSwipe(direction);

            if (shouldNavigate) {
                const currentIndex = getCurrentIndex();
                const targetIndex = direction === "left" ? currentIndex + 1 : currentIndex - 1;

                // Animate out
                mainEl.current.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
                mainEl.current.style.transform = `translateX(${direction === "left" ? "-40%" : "40%"})`;
                mainEl.current.style.opacity = "0";

                setTimeout(() => {
                    router.push(routes[targetIndex]);
                    // After navigation, slide in from opposite side
                    requestAnimationFrame(() => {
                        if (mainEl.current) {
                            mainEl.current.style.transition = "none";
                            mainEl.current.style.transform = `translateX(${direction === "left" ? "30%" : "-30%"})`;
                            mainEl.current.style.opacity = "0";
                            requestAnimationFrame(() => {
                                if (mainEl.current) {
                                    mainEl.current.style.transition = "transform 200ms ease-out, opacity 200ms ease-out";
                                    mainEl.current.style.transform = "translateX(0)";
                                    mainEl.current.style.opacity = "1";

                                    // Cleanup after animation
                                    setTimeout(() => {
                                        if (mainEl.current) {
                                            mainEl.current.style.transition = "";
                                            mainEl.current.style.transform = "";
                                            mainEl.current.style.opacity = "";
                                        }
                                    }, 220);
                                }
                            });
                        }
                    });
                }, 180);
            } else {
                // Snap back
                mainEl.current.style.transition = "transform 200ms ease-out, opacity 200ms ease-out";
                mainEl.current.style.transform = "translateX(0)";
                mainEl.current.style.opacity = "1";

                setTimeout(() => {
                    if (mainEl.current) {
                        mainEl.current.style.transition = "";
                        mainEl.current.style.transform = "";
                        mainEl.current.style.opacity = "";
                    }
                }, 220);
            }
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
            // Cleanup styles
            if (mainEl.current) {
                mainEl.current.style.transition = "";
                mainEl.current.style.transform = "";
                mainEl.current.style.opacity = "";
            }
        };
    }, [canSwipe, getCurrentIndex, router, routes]);
}
