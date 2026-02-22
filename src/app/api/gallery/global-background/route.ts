import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";

/**
 * GET /api/gallery/global-background
 * Returns the current global background image (if any).
 */
export async function GET() {
    try {
        const bg = await prisma.gallery.findFirst({
            where: { isGlobalBackground: true, status: "ACTIVE" },
            select: { id: true, publicUrl: true, name: true },
        });
        return NextResponse.json({ success: true, data: bg });
    } catch (error) {
        console.error("Failed to fetch global background:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

/**
 * POST /api/gallery/global-background
 * Set a gallery image as the global background.
 * Body: { galleryId: string }
 */
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { galleryId } = await req.json();

        if (!galleryId) {
            return NextResponse.json({ error: "galleryId is required" }, { status: 400 });
        }

        // Clear any existing global background
        await prisma.gallery.updateMany({
            where: { isGlobalBackground: true },
            data: { isGlobalBackground: false },
        });

        // Set new one
        const gallery = await prisma.gallery.update({
            where: { id: galleryId },
            data: { isGlobalBackground: true },
            select: { id: true, publicUrl: true, name: true },
        });

        return NextResponse.json({ success: true, data: gallery });
    } catch (error) {
        console.error("Failed to set global background:", error);
        return NextResponse.json({ error: "Failed to set background" }, { status: 500 });
    }
}

/**
 * DELETE /api/gallery/global-background
 * Clears the global background.
 */
export async function DELETE() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.gallery.updateMany({
            where: { isGlobalBackground: true },
            data: { isGlobalBackground: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to clear global background:", error);
        return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
    }
}
