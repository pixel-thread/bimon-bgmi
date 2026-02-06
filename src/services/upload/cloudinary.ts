/**
 * Cloudinary Upload Service for Videos
 * Free tier: 25GB storage, 25GB bandwidth/month
 */

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

export interface CloudinaryUploadResult {
    success: boolean;
    url?: string;
    publicId?: string;
    thumbnailUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    error?: string;
}

/**
 * Upload a video to Cloudinary using unsigned upload preset
 * This allows direct browser uploads without exposing API secret
 */
export async function uploadVideoToCloudinary(
    file: File | Blob,
    options: {
        cloudName: string;
        uploadPreset: string;
        folder?: string;
        resourceType?: "video" | "image" | "auto";
    }
): Promise<CloudinaryUploadResult> {
    const { cloudName, uploadPreset, folder = "character-videos", resourceType = "video" } = options;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    try {
        const response = await fetch(
            `${CLOUDINARY_UPLOAD_URL}/${cloudName}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.json();

        if (result.error) {
            return {
                success: false,
                error: result.error.message || "Upload failed",
            };
        }

        // Generate thumbnail URL for videos
        let thumbnailUrl: string | undefined;
        if (resourceType === "video" && result.public_id) {
            // Cloudinary auto-generates video thumbnails
            thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_0.5,w_270,h_480,c_fill/${result.public_id}.jpg`;
        }

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl,
            duration: result.duration,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

/**
 * Server-side upload using API key (for signed uploads)
 * Use this when you need more control or security
 */
export async function uploadVideoToCloudinaryServer(
    videoData: Buffer | string, // Buffer or base64 string
    options: {
        publicId?: string;
        folder?: string;
        transformation?: string;
    } = {}
): Promise<CloudinaryUploadResult> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return {
            success: false,
            error: "Cloudinary credentials not configured",
        };
    }

    const { folder = "character-videos", publicId, transformation } = options;

    // Create timestamp and signature
    const timestamp = Math.floor(Date.now() / 1000);

    // Sort parameters alphabetically for signature
    const paramsToSign: Record<string, string> = {
        folder,
        timestamp: timestamp.toString(),
    };

    if (publicId) paramsToSign.public_id = publicId;
    if (transformation) paramsToSign.transformation = transformation;

    // Create signature string
    const sortedParams = Object.keys(paramsToSign)
        .sort()
        .map(key => `${key}=${paramsToSign[key]}`)
        .join("&");

    // Generate SHA1 signature
    const crypto = await import("crypto");
    const signature = crypto
        .createHash("sha1")
        .update(sortedParams + apiSecret)
        .digest("hex");

    // Prepare form data
    const formData = new FormData();

    // Handle buffer or base64
    if (Buffer.isBuffer(videoData)) {
        const uint8Array = new Uint8Array(videoData);
        const blob = new Blob([uint8Array], { type: "video/mp4" });
        formData.append("file", blob);
    } else {
        formData.append("file", `data:video/mp4;base64,${videoData}`);
    }

    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    if (publicId) formData.append("public_id", publicId);
    if (transformation) formData.append("transformation", transformation);

    try {
        const response = await fetch(
            `${CLOUDINARY_UPLOAD_URL}/${cloudName}/video/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.json();

        if (result.error) {
            return {
                success: false,
                error: result.error.message || "Upload failed",
            };
        }

        // Generate thumbnail URL
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_0.5,w_270,h_480,c_fill/${result.public_id}.jpg`;

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl,
            duration: result.duration,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

/**
 * Delete a video from Cloudinary
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: "video" | "image" = "video"
): Promise<{ success: boolean; error?: string }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return { success: false, error: "Cloudinary credentials not configured" };
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const crypto = await import("crypto");
    const signature = crypto
        .createHash("sha1")
        .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    try {
        const response = await fetch(
            `${CLOUDINARY_UPLOAD_URL}/${cloudName}/${resourceType}/destroy`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.json();

        if (result.result === "ok") {
            return { success: true };
        }

        return { success: false, error: result.result || "Delete failed" };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Delete failed",
        };
    }
}

/**
 * Get optimized video URL with transformations
 */
export function getOptimizedVideoUrl(
    cloudName: string,
    publicId: string,
    options: {
        width?: number;
        height?: number;
        quality?: "auto" | "auto:low" | "auto:eco" | "auto:good" | "auto:best";
        format?: "mp4" | "webm" | "auto";
    } = {}
): string {
    const { width = 270, height = 480, quality = "auto:eco", format = "mp4" } = options;

    const transformations = [
        `w_${width}`,
        `h_${height}`,
        "c_fill",
        `q_${quality}`,
        `f_${format}`,
    ].join(",");

    return `https://res.cloudinary.com/${cloudName}/video/upload/${transformations}/${publicId}`;
}
