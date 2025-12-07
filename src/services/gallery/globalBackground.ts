import { prisma } from "@/src/lib/db/prisma";

/**
 * Get the global background image (if set)
 */
export async function getGlobalBackground() {
    return await prisma.gallery.findFirst({
        where: {
            isGlobalBackground: true,
            isCharacterImg: false,
            status: "ACTIVE",
        },
    });
}

/**
 * Set a gallery image as the global background
 * Clears any existing global background first
 */
export async function setGlobalBackground({ galleryId }: { galleryId: string }) {
    // First, clear any existing global background
    await prisma.gallery.updateMany({
        where: { isGlobalBackground: true },
        data: { isGlobalBackground: false },
    });

    // Then set the new one
    return await prisma.gallery.update({
        where: { id: galleryId },
        data: { isGlobalBackground: true },
    });
}

/**
 * Clear the global background (no gallery image will be global)
 */
export async function clearGlobalBackground() {
    return await prisma.gallery.updateMany({
        where: { isGlobalBackground: true },
        data: { isGlobalBackground: false },
    });
}
