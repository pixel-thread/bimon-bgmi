import { prisma } from "@/src/lib/db/prisma";
import { supabaseClient } from "@/src/lib/supabase";

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

export async function deleteRecentMatchGroup(id: string) {
    // Get the group with images first
    const group = await prisma.recentMatchGroup.findUnique({
        where: { id },
        include: { images: true },
    });

    if (!group) {
        throw new Error("Recent match group not found");
    }

    // Delete images from storage
    const imagePaths = group.images.map((img) => img.imagePath);
    if (imagePaths.length > 0) {
        const bucketName = `${defaultBucket}/scoreboards`;
        await supabaseClient.storage.from(bucketName).remove(imagePaths);
    }

    // Delete from database (cascade will delete images)
    return prisma.recentMatchGroup.delete({
        where: { id },
    });
}
