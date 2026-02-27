import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/admin/migrate-videos
 * Re-uploads existing character videos with compression (8s, 720p, auto quality).
 * Deletes the old bloated originals. Super admin only.
 */
export async function POST() {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check super admin
    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { role: true },
    });
    if (user?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find all video gallery entries
    const videos = await prisma.gallery.findMany({
        where: { isVideo: true },
        select: { id: true, imageId: true, publicUrl: true, playerId: true },
    });

    if (videos.length === 0) {
        return NextResponse.json({ message: "No videos found", migrated: 0 });
    }

    const results: { id: string; status: string; oldSize?: number; newSize?: number }[] = [];

    for (const video of videos) {
        try {
            // Get info about the current video
            let oldSize = 0;
            try {
                const info = await cloudinary.api.resource(video.imageId, {
                    resource_type: "video",
                });
                oldSize = info.bytes || 0;
            } catch {
                // Resource might not exist
            }

            // Re-upload from existing URL with compression transformations
            const uploadResult = await cloudinary.uploader.upload(video.publicUrl, {
                folder: "character_images",
                public_id: `player_${video.playerId}_${Date.now()}`,
                overwrite: true,
                resource_type: "video",
                transformation: [
                    {
                        width: 720,
                        crop: "limit",
                        quality: "auto",
                        duration: "8",
                        video_codec: "auto",
                    },
                ],
                format: "mp4",
            });

            // Delete old Cloudinary resource
            try {
                await cloudinary.uploader.destroy(video.imageId, {
                    resource_type: "video",
                    invalidate: true,
                });
            } catch {
                // Ignore cleanup errors
            }

            // Update DB with new URL and imageId
            await prisma.gallery.update({
                where: { id: video.id },
                data: {
                    imageId: uploadResult.public_id,
                    path: uploadResult.public_id,
                    fullPath: uploadResult.public_id,
                    publicUrl: uploadResult.secure_url,
                    thumbnailUrl: uploadResult.secure_url.replace(/\.\w+$/, ".jpg"),
                },
            });

            results.push({
                id: video.id,
                status: "migrated",
                oldSize,
                newSize: uploadResult.bytes || 0,
            });
        } catch (error) {
            console.error(`Failed to migrate video ${video.id}:`, error);
            results.push({ id: video.id, status: "failed" });
        }
    }

    const migrated = results.filter((r) => r.status === "migrated").length;
    const totalSaved = results.reduce(
        (acc, r) => acc + ((r.oldSize || 0) - (r.newSize || 0)),
        0
    );

    return NextResponse.json({
        message: `Migrated ${migrated}/${videos.length} videos`,
        savedBytes: totalSaved,
        savedMB: (totalSaved / (1024 * 1024)).toFixed(2),
        results,
    });
}
