/**
 * ImgBB Image Upload Service
 * 
 * Free unlimited image hosting with permanent URLs.
 * Used for job listings, profile images, and other user-uploaded content.
 */

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export type ImgBBUploadResult = {
    success: boolean;
    url: string | null;
    thumbnailUrl: string | null;
    deleteUrl: string | null;
    error: string | null;
};

/**
 * Upload an image to ImgBB
 * 
 * @param imageData - Base64 encoded image string (without data:image prefix) OR a File/Blob
 * @param name - Optional name for the image
 * @returns Upload result with permanent URL
 */
export async function uploadToImgBB(
    imageData: string | Buffer,
    name?: string
): Promise<ImgBBUploadResult> {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
        console.error("IMGBB_API_KEY not set in environment variables");
        return {
            success: false,
            url: null,
            thumbnailUrl: null,
            deleteUrl: null,
            error: "Image upload service not configured",
        };
    }

    try {
        // Convert Buffer to base64 if needed
        const base64Image = Buffer.isBuffer(imageData)
            ? imageData.toString("base64")
            : imageData;

        // Remove data URL prefix if present
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const formData = new FormData();
        formData.append("key", apiKey);
        formData.append("image", cleanBase64);

        if (name) {
            formData.append("name", name);
        }

        const response = await fetch(IMGBB_API_URL, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                url: result.data.url,
                thumbnailUrl: result.data.thumb?.url || result.data.url,
                deleteUrl: result.data.delete_url || null,
                error: null,
            };
        } else {
            console.error("ImgBB upload failed:", result);
            return {
                success: false,
                url: null,
                thumbnailUrl: null,
                deleteUrl: null,
                error: result.error?.message || "Upload failed",
            };
        }
    } catch (error) {
        console.error("ImgBB upload error:", error);
        return {
            success: false,
            url: null,
            thumbnailUrl: null,
            deleteUrl: null,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

/**
 * Upload an image from a URL to ImgBB
 * Useful for transferring images from other sources
 */
export async function uploadUrlToImgBB(
    imageUrl: string,
    name?: string
): Promise<ImgBBUploadResult> {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            url: null,
            thumbnailUrl: null,
            deleteUrl: null,
            error: "Image upload service not configured",
        };
    }

    try {
        const formData = new FormData();
        formData.append("key", apiKey);
        formData.append("image", imageUrl);

        if (name) {
            formData.append("name", name);
        }

        const response = await fetch(IMGBB_API_URL, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                url: result.data.url,
                thumbnailUrl: result.data.thumb?.url || result.data.url,
                deleteUrl: result.data.delete_url || null,
                error: null,
            };
        } else {
            return {
                success: false,
                url: null,
                thumbnailUrl: null,
                deleteUrl: null,
                error: result.error?.message || "Upload failed",
            };
        }
    } catch (error) {
        return {
            success: false,
            url: null,
            thumbnailUrl: null,
            deleteUrl: null,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}
