import { prisma } from "@/src/lib/db/prisma";
import { supabaseClient } from "@/src/lib/supabase";

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

type DeleteResult = {
    success: boolean;
    message: string;
    playersUsing?: { id: string; userName: string }[];
    requiresForce?: boolean;
};

export async function deleteProfileImage(id: string, force: boolean = false): Promise<DeleteResult> {
    // Find the image
    const image = await prisma.gallery.findUnique({
        where: { id },
    });

    if (!image) {
        return { success: false, message: "Image not found" };
    }

    if (!image.isCharacterImg) {
        return { success: false, message: "This is not a profile image" };
    }

    // Check if any player is using this image
    const playersUsingImage = await prisma.player.findMany({
        where: { characterImageId: id },
        include: {
            user: {
                select: { userName: true },
            },
        },
    });

    if (playersUsingImage.length > 0 && !force) {
        return {
            success: false,
            message: `${playersUsingImage.length} player(s) are using this image`,
            playersUsing: playersUsingImage.map((p) => ({
                id: p.id,
                userName: p.user.userName,
            })),
            requiresForce: true,
        };
    }

    // If force delete, reset players to default (null = Google image)
    if (playersUsingImage.length > 0 && force) {
        await prisma.player.updateMany({
            where: { characterImageId: id },
            data: { characterImageId: null },
        });
    }

    // Delete from Supabase storage
    const bucketPath = `${defaultBucket}/profile-images`;
    const { error } = await supabaseClient.storage
        .from(bucketPath)
        .remove([image.path]);

    if (error) {
        console.error(`Failed to delete image from storage: ${error.message}`);
    }

    // Soft delete in database
    await prisma.gallery.update({
        where: { id },
        data: { status: "INACTIVE" },
    });

    return { success: true, message: "Image deleted successfully" };
}

