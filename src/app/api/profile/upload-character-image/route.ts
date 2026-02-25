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
 * POST /api/profile/upload-character-image
 * Uploads a character image to Cloudinary and creates/updates a Gallery record linked to the Player.
 */
export async function POST(req: Request) {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Get player
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                player: {
                    select: {
                        id: true,
                        characterImageId: true,
                        hasRoyalPass: true,
                    },
                },
            },
        });

        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        if (!user.player.hasRoyalPass) {
            return NextResponse.json(
                { error: "Royal Pass required to upload a character image" },
                { status: 403 }
            );
        }

        // Convert file to base64 data URI
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "image/png";
        const dataUri = `data:${mimeType};base64,${base64}`;
        const isVideo = file.type.startsWith("video/");

        // Upload to Cloudinary (auto-detect image vs video)
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "character_images",
            public_id: `player_${user.player.id}_${Date.now()}`,
            overwrite: true,
            resource_type: "auto",
            ...(isVideo
                ? { eager: [{ width: 800, crop: "limit", quality: "auto", format: "mp4" }] }
                : { transformation: [{ width: 800, height: 1200, crop: "limit", quality: "auto" }] }
            ),
        });

        const publicUrl = uploadResult.secure_url;

        // Delete old gallery record if exists
        if (user.player.characterImageId) {
            const oldGallery = await prisma.gallery.findUnique({
                where: { id: user.player.characterImageId },
            });
            if (oldGallery) {
                try {
                    await cloudinary.uploader.destroy(
                        oldGallery.imageId,
                        {
                            invalidate: true,
                            resource_type: oldGallery.isVideo ? "video" : "image",
                        }
                    );
                } catch {
                    // Ignore cleanup errors
                }
            }
        }

        // Create or update Gallery record
        const gallery = await prisma.gallery.upsert({
            where: {
                playerId: user.player.id,
            },
            create: {
                imageId: uploadResult.public_id,
                name: `${user.player.id}_character`,
                path: uploadResult.public_id,
                fullPath: uploadResult.public_id,
                publicUrl,
                isCharacterImg: true,
                isAnimated: false,
                isVideo,
                thumbnailUrl: isVideo
                    ? uploadResult.secure_url.replace(/\.\w+$/, ".jpg")
                    : null,
                playerId: user.player.id,
            },
            update: {
                imageId: uploadResult.public_id,
                path: uploadResult.public_id,
                fullPath: uploadResult.public_id,
                publicUrl,
                isVideo,
                thumbnailUrl: isVideo
                    ? uploadResult.secure_url.replace(/\.\w+$/, ".jpg")
                    : null,
            },
        });

        // Link to player
        await prisma.player.update({
            where: { id: user.player.id },
            data: { characterImageId: gallery.id },
        });

        return NextResponse.json({
            success: true,
            imageUrl: publicUrl,
            galleryId: gallery.id,
        });
    } catch (error) {
        console.error("Character image upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
