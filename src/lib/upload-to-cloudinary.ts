import { compressImage } from "./compress-image";

/**
 * Upload a bracket screenshot to Cloudinary using unsigned upload.
 * Images are stored under `bracket-results/{matchId}` for easy cleanup.
 * Returns a Cloudinary URL with auto-format and auto-quality transformations.
 */
export async function uploadToCloudinary(
    file: File,
    matchId: string
): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary not configured");
    }

    // Compress before upload
    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `bracket-results/${matchId}`);
    formData.append("public_id", `${matchId}-${Date.now()}`);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
    );

    const data = await res.json();

    if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    // Return optimized URL: auto format, auto quality, max width 800
    // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
    // Insert transformations after /upload/
    const url: string = data.secure_url;
    return url.replace("/upload/", "/upload/f_auto,q_auto,w_500/");
}
