import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/gallery/upload
 * Upload a new image to ImgBB and save it as a Gallery entry.
 * Body: multipart/form-data with "image" field.
 */
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert to base64 and upload to ImgBB
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("key", process.env.IMGBB_API_KEY!);
        imgbbForm.append("image", base64);
        imgbbForm.append("name", `gallery_${Date.now()}`);

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
        const imageId = imgbbData.data.id;

        // Create gallery entry
        const gallery = await prisma.gallery.create({
            data: {
                imageId,
                name: file.name || "Gallery Image",
                path: imageUrl,
                fullPath: imageUrl,
                publicUrl: imageUrl,
                isCharacterImg: false,
            },
        });

        return NextResponse.json({
            success: true,
            data: { id: gallery.id, publicUrl: gallery.publicUrl, name: gallery.name },
        });
    } catch (error) {
        console.error("Gallery upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
