"use client";

import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useEffect, useState } from "react";

/**
 * Invisible client component that enables Instagram-like
 * swipe-between-tabs navigation on mobile.
 *
 * For admins, includes the dashboard as the first swipeable tab
 * and remembers the last-visited dashboard sub-page.
 */
export function SwipeNavigator() {
    const { isAdmin } = useAuthUser();

    // Read the persisted last dashboard page (same key used by MobileNav)
    const [lastDashboardHref, setLastDashboardHref] = useState("/dashboard");

    useEffect(() => {
        try {
            const saved = localStorage.getItem("lastDashboardPage");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.href) setLastDashboardHref(parsed.href);
            }
        } catch { }
    }, []);

    useSwipeNavigation(isAdmin, lastDashboardHref);

    return null;
}
