"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Ordered list of swipeable tab routes for regular users.
 * Matches the mobile nav tab order exactly.
 */
const USER_ROUTES = [
    { path: "/players", label: "Players" },
    { path: "/vote", label: "Vote" },
    { path: "/wallet", label: "Wallet" },
    { path: "/profile", label: "Profile" },
];

const DASHBOARD_PREFIX = "/dashboard";

/** Minimum horizontal distance (px) to trigger navigation */
const MIN_SWIPE_DISTANCE = 60;

/** Maximum ratio of vertical/horizontal movement */
const MAX_VERTICAL_RATIO = 0.75;

/**
 * Hook that enables Instagram-like swipe navigation between main tab pages.
 * Shows the current page sliding away and a peek of the next page sliding in.
 */
export function useSwipeNavigation(
    isAdmin = false,
    lastDashboardHref = "/dashboard"
) {
    const pathname = usePathname();
    const router = useRouter();

    const routes = useMemo(() => {
        if (isAdmin) {
            return [{ path: lastDashboardHref, label: "Dashboard" }, ...USER_ROUTES];
        }
        return USER_ROUTES;
    }, [isAdmin, lastDashboardHref]);

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);
    const directionLocked = useRef<"horizontal" | "vertical" | null>(null);
    const mainEl = useRef<HTMLElement | null>(null);
    const peekEl = useRef<HTMLDivElement | null>(null);

    const getCurrentIndex = useCallback(() => {
        return routes.findIndex((route) => {
            if (route.path.startsWith(DASHBOARD_PREFIX)) {
                return pathname.startsWith(DASHBOARD_PREFIX);
            }
            return pathname.startsWith(route.path);
        });
    }, [pathname, routes]);

    const canSwipe = useCallback(
        (direction: "left" | "right") => {
            const idx = getCurrentIndex();
            if (idx === -1) return false;
            if (direction === "left") return idx < routes.length - 1;
            return idx > 0;
        },
        [getCurrentIndex, routes.length]
    );

    const getTargetRoute = useCallback(
        (direction: "left" | "right") => {
            const idx = getCurrentIndex();
            if (idx === -1) return null;
            const targetIdx = direction === "left" ? idx + 1 : idx - 1;
            if (targetIdx < 0 || targetIdx >= routes.length) return null;
            return routes[targetIdx];
        },
        [getCurrentIndex, routes]
    );

    /** Create or update the peek panel */
    const showPeek = useCallback(
        (direction: "left" | "right", progress: number) => {
            const target = getTargetRoute(direction);
            if (!target) return;

            if (!peekEl.current) {
                const el = document.createElement("div");
                el.id = "swipe-peek";
                el.style.cssText = `
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    width: 100%;
                    z-index: 40;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--background, #000);
                    pointer-events: none;
                    will-change: transform;
                `;
                // Inner content
                el.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;opacity:0.5;">
                        <div style="width:24px;height:24px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></div>
                        <span style="font-size:14px;font-weight:600;color:currentColor;">${target.label}</span>
                    </div>
                `;
                document.body.appendChild(el);
                peekEl.current = el;

                // Add spinner keyframe if not exists
                if (!document.getElementById("swipe-spinner-style")) {
                    const style = document.createElement("style");
                    style.id = "swipe-spinner-style";
                    style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
                    document.head.appendChild(style);
                }
            }

            // Position: off-screen on the incoming side, sliding in based on progress
            const offset = (1 - progress) * 100;
            if (direction === "left") {
                peekEl.current.style.right = "0";
                peekEl.current.style.left = "auto";
                peekEl.current.style.transform = `translateX(${offset}%)`;
            } else {
                peekEl.current.style.left = "0";
                peekEl.current.style.right = "auto";
                peekEl.current.style.transform = `translateX(-${offset}%)`;
            }
        },
        [getTargetRoute]
    );

    const hidePeek = useCallback(() => {
        if (peekEl.current) {
            peekEl.current.remove();
            peekEl.current = null;
        }
    }, []);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)");
        if (!mq.matches) return;

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
                mainEl.current.style.willChange = "transform";
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStart.current || !mainEl.current) return;

            const touch = e.touches[0];
            const dx = touch.clientX - touchStart.current.x;
            const dy = Math.abs(touch.clientY - touchStart.current.y);
            const absDx = Math.abs(dx);

            // Lock direction
            if (!directionLocked.current && (absDx > 10 || dy > 10)) {
                if (dy > absDx * MAX_VERTICAL_RATIO) {
                    directionLocked.current = "vertical";
                    touchStart.current = null;
                    return;
                }
                directionLocked.current = "horizontal";
            }

            if (directionLocked.current !== "horizontal") return;

            const direction = dx < 0 ? "left" : "right";

            if (!canSwipe(direction)) {
                // Rubber-band at edges
                const rubber = Math.sign(dx) * Math.pow(absDx, 0.5) * 2;
                mainEl.current.style.transform = `translateX(${rubber}px)`;
                hidePeek();
                isDragging.current = true;
                return;
            }

            isDragging.current = true;

            const screenWidth = window.innerWidth;
            const progress = Math.min(absDx / screenWidth, 1);

            // Move current page
            mainEl.current.style.transform = `translateX(${dx}px)`;

            // Show peek of next page
            showPeek(direction, progress);

            // Prefetch the target
            const target = getTargetRoute(direction);
            if (target) router.prefetch(target.path);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current || !isDragging.current || !mainEl.current) {
                if (mainEl.current) {
                    mainEl.current.style.transition = "";
                    mainEl.current.style.transform = "";
                    mainEl.current.style.willChange = "";
                }
                touchStart.current = null;
                isDragging.current = false;
                directionLocked.current = null;
                hidePeek();
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
                const target = getTargetRoute(direction);
                if (!target) {
                    resetMain();
                    hidePeek();
                    return;
                }

                const screenW = window.innerWidth;

                // Animate current page off-screen
                mainEl.current.style.transition = "transform 200ms ease-out";
                mainEl.current.style.transform = `translateX(${direction === "left" ? -screenW : screenW}px)`;

                // Animate peek to full position
                if (peekEl.current) {
                    peekEl.current.style.transition = "transform 200ms ease-out";
                    peekEl.current.style.transform = "translateX(0)";
                }

                setTimeout(() => {
                    hidePeek();
                    router.push(target.path);

                    // Reset after navigation
                    requestAnimationFrame(() => {
                        if (mainEl.current) {
                            mainEl.current.style.transition = "";
                            mainEl.current.style.transform = "";
                            mainEl.current.style.willChange = "";
                        }
                    });
                }, 200);
            } else {
                // Snap back
                mainEl.current.style.transition = "transform 200ms ease-out";
                mainEl.current.style.transform = "translateX(0)";

                if (peekEl.current) {
                    peekEl.current.style.transition = "transform 200ms ease-out";
                    const dir = dx < 0 ? "100%" : "-100%";
                    peekEl.current.style.transform = `translateX(${dir})`;
                }

                setTimeout(() => {
                    resetMain();
                    hidePeek();
                }, 220);
            }
        };

        const resetMain = () => {
            if (mainEl.current) {
                mainEl.current.style.transition = "";
                mainEl.current.style.transform = "";
                mainEl.current.style.willChange = "";
            }
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
            resetMain();
            hidePeek();
        };
    }, [canSwipe, getTargetRoute, hidePeek, router, showPeek]);
}
