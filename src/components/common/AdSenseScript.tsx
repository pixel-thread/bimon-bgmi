"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

// Routes where AdSense should NOT load (low-content pages)
const EXCLUDED_ROUTES = [
    "/sign-in",
    "/sign-up",
    "/onboarding",
    "/sso-callback",
    "/auth",
    "/verify",
    "/reset-password",
    "/forgot-password",
];

// Check if current path starts with any excluded route
const isExcludedRoute = (pathname: string): boolean => {
    return EXCLUDED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
};

export const AdSenseScript = () => {
    const pathname = usePathname();

    // Don't load AdSense on excluded routes
    if (isExcludedRoute(pathname)) {
        return null;
    }

    return (
        <>
            <Script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2651043074081875"
                crossOrigin="anonymous"
                strategy="lazyOnload"
            />
        </>
    );
};
