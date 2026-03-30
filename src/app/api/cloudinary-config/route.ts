import { NextResponse } from "next/server";

/**
 * GET /api/cloudinary-config
 * Returns public Cloudinary config (cloud name + upload preset) to the client.
 * This avoids relying on NEXT_PUBLIC_ env vars being inlined at build time.
 */
export async function GET() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    return NextResponse.json({ cloudName, uploadPreset });
}
