"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useMemo } from "react";

/**
 * SVG icon paths matching lucide-react icons used in the mobile nav.
 * Each is a 24x24 viewBox path with stroke styling.
 */
const ICONS: Record<string, string> = {
    // Users icon
    "/players": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    // Vote icon
    "/vote": `<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/>`,
    // Wallet icon
    "/wallet": `<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>`,
    // User/Profile icon
    "/profile": `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    // LayoutDashboard icon
    "/dashboard": `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/>`,
};

function getIconSvg(path: string): string {
    // Match dashboard routes
    const key = path.startsWith("/dashboard") ? "/dashboard" : path;
    const iconPath = ICONS[key] || ICONS["/players"];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>`;
}

/**
 * Ordered list of swipeable tab routes.
 */
const USER_ROUTES = [
    { path: "/players", label: "Players" },
    { path: "/vote", label: "Vote" },
    { path: "/wallet", label: "Wallet" },
    { path: "/profile", label: "Profile" },
];

const DASHBOARD_PREFIX = "/dashboard";
const MIN_SWIPE_DISTANCE = 60;
const MAX_VERTICAL_RATIO = 0.75;

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
    const navigating = useRef(false);

    // Reset main when pathname changes (new page rendered)
    useEffect(() => {
        if (navigating.current) {
            navigating.current = false;
            const main = document.querySelector("main") as HTMLElement;
            if (main) {
                main.style.transition = "none";
                main.style.transform = "";
                main.style.opacity = "1";
                main.style.willChange = "";
                // Remove transition:none after a frame
                requestAnimationFrame(() => {
                    main.style.transition = "";
                });
            }
        }
    }, [pathname]);

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
                    background: var(--background, #0a0a0a);
                    pointer-events: none;
                    will-change: transform;
                `;
                el.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;opacity:0.35;">
                        ${getIconSvg(target.path)}
                        <span style="font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">${target.label}</span>
                    </div>
                `;
                document.body.appendChild(el);
                peekEl.current = el;
            }

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
                const rubber = Math.sign(dx) * Math.pow(absDx, 0.5) * 2;
                mainEl.current.style.transform = `translateX(${rubber}px)`;
                hidePeek();
                isDragging.current = true;
                return;
            }

            isDragging.current = true;

            const screenWidth = window.innerWidth;
            const progress = Math.min(absDx / screenWidth, 1);

            mainEl.current.style.transform = `translateX(${dx}px)`;
            showPeek(direction, progress);

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

                mainEl.current.style.transition = "transform 200ms ease-out";
                mainEl.current.style.transform = `translateX(${direction === "left" ? -screenW : screenW}px)`;

                if (peekEl.current) {
                    peekEl.current.style.transition = "transform 200ms ease-out";
                    peekEl.current.style.transform = "translateX(0)";
                }

                setTimeout(() => {
                    hidePeek();
                    // Keep main hidden until new page renders
                    if (mainEl.current) {
                        mainEl.current.style.opacity = "0";
                    }
                    navigating.current = true;
                    router.push(target.path);
                }, 200);
            } else {
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
