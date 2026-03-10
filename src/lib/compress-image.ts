/**
 * Client-side image compression using canvas.
 * Resizes to max 1200px and compresses to ~80% JPEG quality.
 * Typical result: 3-5MB phone screenshot → 80-150KB.
 */
export async function compressImage(
    file: File,
    maxWidth = 1200,
    quality = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Only downscale, never upscale
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    // Only use compressed if it's actually smaller
                    resolve(compressed.size < file.size ? compressed : file);
                },
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => reject(new Error("Failed to load image for compression"));
        img.src = URL.createObjectURL(file);
    });
}
