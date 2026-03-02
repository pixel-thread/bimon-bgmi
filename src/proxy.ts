import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/settings",
    "/vote",
    "/wallet",
    "/players",
    "/notifications",
    "/onboarding",
    "/jobs",
    "/winners",
    "/royal-pass",
    "/promoter",
    "/refer",
];

// Routes that are always public (bypass auth check)
const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/about",
    "/faq",
    "/rules",
    "/recent-matches",
    "/api/auth", // NextAuth handler
    "/api/cron",
    "/api/payments/webhook",
];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Check if it's a public route
    const isPublic = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (isPublic) return NextResponse.next();

    // Check if it's a protected route
    const isProtected = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isProtected && !req.auth) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip static files and Next.js internals
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
