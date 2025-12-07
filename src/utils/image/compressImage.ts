/**
 * Compresses an image file using canvas to reduce its size while maintaining quality
 * @param file - The original image file
 * @param targetSizeKB - Target size in KB (default: 1024 = ~1MB)
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1080)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
    file: File,
    targetSizeKB: number = 1024,
    maxWidth: number = 1920,
    maxHeight: number = 1080
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Start with high quality and reduce until we hit target size
                let quality = 0.9;
                const minQuality = 0.1;
                const targetSizeBytes = targetSizeKB * 1024;

                const compress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("Could not compress image"));
                                return;
                            }

                            // If blob is small enough or quality is at minimum, return it
                            if (blob.size <= targetSizeBytes || quality <= minQuality) {
                                const compressedFile = new File([blob], file.name, {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                // Reduce quality and try again
                                quality -= 0.1;
                                compress();
                            }
                        },
                        "image/jpeg",
                        quality
                    );
                };

                compress();
            };

            img.onerror = () => {
                reject(new Error("Could not load image"));
            };
        };

        reader.onerror = () => {
            reject(new Error("Could not read file"));
        };
    });
}

/**
 * Compresses an image file for gallery backgrounds
 * Uses higher resolution and size limits suitable for backgrounds
 * @param file - The original image file
 * @returns Promise<File> - The compressed image file
 */
export async function compressGalleryImage(file: File): Promise<File> {
    // For backgrounds, allow up to 2MB and higher resolution
    return compressImage(file, 2048, 2560, 1440);
}

/**
 * Compresses an image if it exceeds the size limit
 * @param file - The original image file
 * @param maxSizeKB - Maximum size in KB before compression kicks in
 * @returns Promise<File> - The original or compressed file
 */
export async function compressIfNeeded(
    file: File,
    maxSizeKB: number = 5000
): Promise<File> {
    const fileSizeKB = file.size / 1024;

    // If file is already small enough, return as-is
    if (fileSizeKB <= maxSizeKB) {
        return file;
    }

    // Compress to target size (slightly under max to be safe)
    return compressImage(file, maxSizeKB * 0.9);
}
