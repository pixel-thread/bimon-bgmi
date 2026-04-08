import { NextResponse } from "next/server";
import { GAME } from "@/lib/game-config";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/profile/upload-character-image
 *
 * Supports two upload flows:
 *
 * 1) **Image upload (FormData)** — image file sent via FormData.
 *    Server converts to base64, uploads to Cloudinary, saves DB record.
 *
 * 2) **Video save (JSON)** — video already uploaded client-side to Cloudinary.
 *    Body: { cloudinaryUrl, publicId, isVideo: true }
 *    Server only creates/updates the Gallery DB record.
 *    (Videos bypass server to avoid Vercel's 4.5MB body size limit.)
 */
export async function POST(req: Request) {
    const email = await getAuthEmail();
    if (!email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get player
        const user = await prisma.user.findFirst({
            where: userWhereEmail(email),
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

        // Only require Royal Pass for games that have the RP feature (BGMI/FF)
        if (GAME.features.hasRoyalPass && !user.player.hasRoyalPass) {
            return NextResponse.json(
                { error: `${GAME.passName} required to upload a character image` },
                { status: 403 }
            );
        }

        const contentType = req.headers.get("content-type") || "";

        // ── Flow 2: Video already uploaded from client (JSON body) ──
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { cloudinaryUrl, publicId, isVideo } = body as {
                cloudinaryUrl: string;
                publicId: string;
                isVideo: boolean;
            };

            if (!cloudinaryUrl || !publicId) {
                return NextResponse.json({ error: "Missing cloudinaryUrl or publicId" }, { status: 400 });
            }

            const thumbnailUrl = isVideo
                ? cloudinaryUrl.replace(/\.[^.]+$/, ".jpg")
                : null;

            // Delete old gallery record if exists
            await cleanupOldCharacterImage(user.player.characterImageId);

            // Create or update Gallery record
            const gallery = await prisma.gallery.upsert({
                where: { playerId: user.player.id },
                create: {
                    imageId: publicId,
                    name: `${user.player.id}_character`,
                    path: publicId,
                    fullPath: publicId,
                    publicUrl: cloudinaryUrl,
                    isCharacterImg: true,
                    isAnimated: false,
                    isVideo: !!isVideo,
                    thumbnailUrl,
                    playerId: user.player.id,
                },
                update: {
                    imageId: publicId,
                    path: publicId,
                    fullPath: publicId,
                    publicUrl: cloudinaryUrl,
                    isVideo: !!isVideo,
                    thumbnailUrl,
                },
            });

            // Link to player
            await prisma.player.update({
                where: { id: user.player.id },
                data: { characterImageId: gallery.id },
            });

            return NextResponse.json({
                success: true,
                imageUrl: cloudinaryUrl,
                galleryId: gallery.id,
            });
        }

        // ── Flow 1: Image uploaded via FormData ──
        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert file to base64 data URI
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "image/png";
        const dataUri = `data:${mimeType};base64,${base64}`;
        const isVideo = file.type.startsWith("video/");

        // 50MB limit
        if (bytes.byteLength > 50 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
        }

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "character_images",
            public_id: `player_${user.player.id}_${Date.now()}`,
            overwrite: true,
            resource_type: isVideo ? "video" : "image",
            ...(isVideo
                ? { format: "mp4" }
                : {
                    transformation: [
                        { width: 800, height: 1200, crop: "limit", quality: "auto" },
                    ],
                }
            ),
        });

        const publicUrl = uploadResult.secure_url;

        // Delete old gallery record if exists
        await cleanupOldCharacterImage(user.player.characterImageId);

        // Create or update Gallery record
        const gallery = await prisma.gallery.upsert({
            where: { playerId: user.player.id },
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

/**
 * Cleanup old Cloudinary asset + gallery record
 */
async function cleanupOldCharacterImage(characterImageId: string | null) {
    if (!characterImageId) return;

    const oldGallery = await prisma.gallery.findUnique({
        where: { id: characterImageId },
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
