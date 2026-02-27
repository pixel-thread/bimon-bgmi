import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/profile(.*)",
    "/settings(.*)",
    "/vote(.*)",
    "/wallet(.*)",
    "/players(.*)",
    "/notifications(.*)",
    "/onboarding(.*)",
    "/jobs(.*)",
    "/winners(.*)",
    "/royal-pass(.*)",
    "/promoter(.*)",
    "/refer(.*)",
]);

// Routes that are always public
const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/about",
    "/faq",
    "/rules",
    "/recent-matches(.*)",
    "/api/cron(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
        const { userId } = await auth();
        if (!userId) {
            const signInUrl = new URL("/sign-in", request.url);
            signInUrl.searchParams.set("redirect_url", request.url);
            return NextResponse.redirect(signInUrl);
        }
    }
});

export const config = {
    matcher: [
        // Skip static files and Next.js internals
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
