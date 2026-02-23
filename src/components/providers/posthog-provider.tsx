"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false, // We capture manually below
        capture_pageleave: true,
        persistence: "localStorage",
    });
}

/** Track page views on route change */
function PostHogPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const ph = usePostHog();

    useEffect(() => {
        if (pathname && ph) {
            let url = window.origin + pathname;
            const search = searchParams?.toString();
            if (search) url += `?${search}`;
            ph.capture("$pageview", { $current_url: url });
        }
    }, [pathname, searchParams, ph]);

    return null;
}

/** Identify logged-in users */
function PostHogIdentify() {
    const { user } = useUser();
    const ph = usePostHog();

    useEffect(() => {
        if (user && ph) {
            ph.identify(user.id, {
                email: user.primaryEmailAddress?.emailAddress,
                username: user.username,
                name: user.fullName,
            });
        }
    }, [user, ph]);

    return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return <>{children}</>;
    }

    return (
        <PHProvider client={posthog}>
            <PostHogPageView />
            <PostHogIdentify />
            {children}
        </PHProvider>
    );
}
