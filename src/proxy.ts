import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/players(.*)",
    "/vote(.*)",
    "/profile(.*)",
    "/wallet(.*)",
    "/settings(.*)",
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
        await auth.protect();
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
