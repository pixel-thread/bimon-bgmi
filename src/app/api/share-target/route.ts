import { NextRequest, NextResponse } from "next/server";

// This route is a fallback if the service worker doesn't intercept
// Just redirect to recent-matches - the SW should have handled the images
export async function POST(request: NextRequest) {
    // Count images for the URL param
    try {
        const formData = await request.formData();
        const images = formData.getAll("images") as File[];
        const count = images.length;

        // Redirect - the service worker should have already cached the images
        return NextResponse.redirect(
            new URL(`/admin/recent-matches?shared=${count}`, request.url)
        );
    } catch {
        return NextResponse.redirect(
            new URL("/admin/recent-matches", request.url)
        );
    }
}

// Also handle GET in case of issues
export async function GET(request: NextRequest) {
    return NextResponse.redirect(
        new URL("/admin/recent-matches", request.url)
    );
}
