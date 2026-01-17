import { NextRequest, NextResponse } from "next/server";

// This route receives images from PWA Share Target
// It stores them in a cookie/session and redirects to recent-matches
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const images = formData.getAll("images") as File[];

        if (images.length === 0) {
            return NextResponse.redirect(new URL("/admin/recent-matches", request.url));
        }

        // Convert images to base64 and store in a temporary way
        // We'll use URL params to signal that images are incoming
        const imageCount = images.length;

        // Store images in cache for the client to retrieve
        // Since we can't directly pass files, we'll use a cache approach
        const cache = await caches.open("share-target-cache");

        // Create a new FormData to store
        const cacheFormData = new FormData();
        images.forEach((img) => cacheFormData.append("images", img));

        // Store as a Response
        await cache.put(
            "/shared-images",
            new Response(cacheFormData)
        );

        // Redirect to recent-matches with a flag
        return NextResponse.redirect(
            new URL(`/admin/recent-matches?shared=${imageCount}`, request.url)
        );
    } catch (error) {
        console.error("Share target error:", error);
        return NextResponse.redirect(new URL("/admin/recent-matches", request.url));
    }
}
