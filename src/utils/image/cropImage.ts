/**
 * Crops an image file to show only the right portion (for BGMI scoreboards)
 * @param file - The original image file
 * @param cropPercentFromLeft - Percentage from left to start cropping (e.g., 0.52 = crop left 52%)
 * @returns A new File with the cropped image
 */
export async function cropImageRightHalf(
    file: File,
    cropPercentFromLeft: number = 0.52
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Calculate crop dimensions
                const startX = Math.floor(img.width * cropPercentFromLeft);
                const cropWidth = img.width - startX;
                const cropHeight = img.height;

                // Set canvas size to cropped dimensions
                canvas.width = cropWidth;
                canvas.height = cropHeight;

                // Draw the cropped portion
                ctx.drawImage(
                    img,
                    startX, 0,           // Source x, y
                    cropWidth, cropHeight, // Source width, height
                    0, 0,                 // Dest x, y
                    cropWidth, cropHeight  // Dest width, height
                );

                // Convert canvas to WebP blob for smaller file size
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Failed to create blob"));
                            return;
                        }

                        // Create new file with WebP extension
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        const croppedFile = new File(
                            [blob],
                            `right_${baseName}.webp`,
                            { type: "image/webp" }
                        );

                        resolve(croppedFile);
                    },
                    "image/webp",
                    0.85 // Good quality for text readability, much smaller size
                );
            } finally {
                URL.revokeObjectURL(url);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

/**
 * Crops an image file to show only the LEFT portion (positions 1-3)
 */
export async function cropImageLeftHalf(
    file: File,
    cropPercentKeep: number = 0.52
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Calculate crop dimensions - keep left portion
                const cropWidth = Math.floor(img.width * cropPercentKeep);
                const cropHeight = img.height;

                canvas.width = cropWidth;
                canvas.height = cropHeight;

                ctx.drawImage(
                    img,
                    0, 0,                 // Source x, y (start from left)
                    cropWidth, cropHeight, // Source width, height
                    0, 0,                 // Dest x, y
                    cropWidth, cropHeight  // Dest width, height
                );

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Failed to create blob"));
                            return;
                        }

                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        const croppedFile = new File(
                            [blob],
                            `left_${baseName}.webp`,
                            { type: "image/webp" }
                        );

                        resolve(croppedFile);
                    },
                    "image/webp",
                    0.85 // Good quality for text readability
                );
            } finally {
                URL.revokeObjectURL(url);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

/**
 * Crops scoreboard images: returns LEFT half of first image + RIGHT halves of ALL images
 * This gives you: positions 1-3 from first image + positions 4+ from each image
 * 
 * @param files - Array of scoreboard screenshot files
 * @returns Array with (files.length + 1) images: 1 left + N right halves
 */
export async function cropScoreboardImages(
    files: File[],
    cropPercent: number = 0.52
): Promise<File[]> {
    if (files.length === 0) return [];

    // Get left half from first image (positions 1-3)
    const leftHalf = await cropImageLeftHalf(files[0], cropPercent);

    // Get right half from all images (positions 4+)
    const rightHalves = await Promise.all(
        files.map((file) => cropImageRightHalf(file, cropPercent))
    );

    // Return: [left half] + [all right halves]
    return [leftHalf, ...rightHalves];
}

/**
 * Legacy function for backwards compatibility
 */
export async function cropImagesRightHalf(
    files: File[],
    cropPercentFromLeft: number = 0.52
): Promise<File[]> {
    return cropScoreboardImages(files, cropPercentFromLeft);
}
