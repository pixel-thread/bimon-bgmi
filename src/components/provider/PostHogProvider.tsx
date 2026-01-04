"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Component to track page views (wrapped in Suspense for useSearchParams)
function PostHogPageViewInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && typeof window !== "undefined" && posthog.__loaded) {
            let url = window.origin + pathname;
            if (searchParams?.toString()) {
                url = url + `?${searchParams.toString()}`;
            }
            posthog.capture("$pageview", { $current_url: url });
        }
    }, [pathname, searchParams]);

    return null;
}

function PostHogPageView() {
    return (
        <Suspense fallback={null}>
            <PostHogPageViewInner />
        </Suspense>
    );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Only initialize on client side
        if (typeof window === "undefined") return;
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

        // Check if already initialized
        if (posthog.__loaded) {
            setIsReady(true);
            return;
        }

        try {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
                person_profiles: "identified_only",
                capture_pageview: false, // We manually capture page views
                capture_pageleave: true,
                persistence: "localStorage",
                bootstrap: {
                    distinctID: undefined,
                },
                loaded: () => {
                    if (process.env.NODE_ENV === "development") {
                        posthog.debug(false); // Disable debug logs in dev to reduce noise
                    }
                    setIsReady(true);
                },
            });
        } catch (error) {
            console.warn("PostHog initialization failed:", error);
            // Still render children even if PostHog fails
            setIsReady(true);
        }
    }, []);

    // Always render children, wrap with provider only if PostHog is configured
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>;
    }

    return (
        <PHProvider client={posthog}>
            {isReady && <PostHogPageView />}
            {children}
        </PHProvider>
    );
}

// Export posthog for custom event tracking
export { posthog };
