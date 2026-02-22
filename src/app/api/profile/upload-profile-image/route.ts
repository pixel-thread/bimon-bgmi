import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/profile/upload-profile-image
 * Uploads a profile image to ImgBB and saves the URL in Player.customProfileImageUrl.
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

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        // Upload to ImgBB
        const imgbbForm = new FormData();
        imgbbForm.append("key", process.env.IMGBB_API_KEY!);
        imgbbForm.append("image", base64);
        imgbbForm.append("name", `profile_${clerkId}_${Date.now()}`);

        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: imgbbForm,
        });

        if (!imgbbRes.ok) {
            const err = await imgbbRes.text();
            console.error("ImgBB upload failed:", err);
            return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
        }

        const imgbbData = await imgbbRes.json();
        const imageUrl = imgbbData.data.url;

        // Update player's customProfileImageUrl
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { player: { select: { id: true } } },
        });

        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        await prisma.player.update({
            where: { id: user.player.id },
            data: { customProfileImageUrl: imageUrl },
        });

        return NextResponse.json({
            success: true,
            imageUrl,
        });
    } catch (error) {
        console.error("Profile image upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
