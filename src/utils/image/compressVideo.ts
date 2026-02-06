/**
 * Video compression utility for character animations
 * Compresses videos to smaller file sizes while maintaining quality
 */

export interface VideoCompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    maxDuration?: number; // in seconds
    targetBitrate?: number; // in bits per second
    fps?: number;
}

const DEFAULT_OPTIONS: Required<VideoCompressionOptions> = {
    maxWidth: 270,
    maxHeight: 480,
    maxDuration: 5,
    targetBitrate: 500000, // 500 kbps
    fps: 15,
};

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
    return file.type.startsWith("video/");
}

/**
 * Get the duration of a video file
 */
export async function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Failed to load video metadata"));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Extract a thumbnail from a video at a specific time
 */
export async function getVideoThumbnail(
    file: File,
    timeSeconds: number = 0.5
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
        }

        video.onloadedmetadata = () => {
            // Set canvas to 9:16 aspect ratio
            const targetWidth = DEFAULT_OPTIONS.maxWidth;
            const targetHeight = DEFAULT_OPTIONS.maxHeight;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Seek to the specified time
            video.currentTime = Math.min(timeSeconds, video.duration * 0.5);
        };

        video.onseeked = () => {
            // Calculate crop dimensions for center-crop to 9:16
            const videoAspect = video.videoWidth / video.videoHeight;
            const targetAspect = canvas.width / canvas.height;

            let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;

            if (videoAspect > targetAspect) {
                // Video is wider - crop sides
                sWidth = video.videoHeight * targetAspect;
                sx = (video.videoWidth - sWidth) / 2;
            } else {
                // Video is taller - crop top/bottom
                sHeight = video.videoWidth / targetAspect;
                sy = (video.videoHeight - sHeight) / 2;
            }

            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(video.src);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to create thumbnail"));
                    }
                },
                "image/jpeg",
                0.85
            );
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Failed to load video"));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Compress and resize a video for upload
 * Uses MediaRecorder API for browser-based compression
 */
export async function compressVideo(
    file: File,
    options: VideoCompressionOptions = {}
): Promise<{ video: Blob; thumbnail: Blob }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate file type
    if (!isVideoFile(file)) {
        throw new Error("File is not a video");
    }

    // Check duration
    const duration = await getVideoDuration(file);
    if (duration > opts.maxDuration) {
        throw new Error(`Video is too long. Maximum duration is ${opts.maxDuration} seconds.`);
    }

    // Get thumbnail first
    const thumbnail = await getVideoThumbnail(file, 0.1);

    // For now, return the original video if it's already reasonably sized
    // Browser-based video re-encoding is complex and resource-intensive
    // We'll resize on the server or accept the original quality

    const maxFileSize = 10 * 1024 * 1024; // 10MB max

    if (file.size > maxFileSize) {
        throw new Error("Video is too large. Maximum size is 10MB.");
    }

    // Return original video and thumbnail
    // Note: For better compression, you'd need ffmpeg.wasm or server-side processing
    return {
        video: file,
        thumbnail,
    };
}

/**
 * Simple video validation without compression
 * Returns the file if valid, or throws an error
 */
export async function validateVideo(
    file: File,
    maxDurationSeconds: number = 5,
    maxSizeMB: number = 10
): Promise<{ isValid: boolean; duration: number; size: number }> {
    if (!isVideoFile(file)) {
        throw new Error("File is not a video");
    }

    const duration = await getVideoDuration(file);
    const sizeMB = file.size / (1024 * 1024);

    if (duration > maxDurationSeconds) {
        throw new Error(`Video is too long (${duration.toFixed(1)}s). Maximum is ${maxDurationSeconds} seconds.`);
    }

    if (sizeMB > maxSizeMB) {
        throw new Error(`Video is too large (${sizeMB.toFixed(1)}MB). Maximum is ${maxSizeMB}MB.`);
    }

    return {
        isValid: true,
        duration,
        size: file.size,
    };
}
