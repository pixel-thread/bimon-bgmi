import { prisma } from "@/src/lib/db/prisma";
import { supabaseClient } from "@/src/lib/supabase";

const defaultBucket = process.env.SUPABASE_BUCKET_NAME as string;

export async function cleanupOldRecentMatches() {
    // Calculate date 1 week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find groups that are older than 1 week
    const oldGroups = await prisma.recentMatchGroup.findMany({
        where: {
            createdAt: {
                lt: oneWeekAgo,
            },
        },
        include: { images: true },
    });

    if (oldGroups.length === 0) {
        return { deleted: 0 };
    }

    // Collect all image paths for deletion from storage
    const allImagePaths = oldGroups.flatMap((group) =>
        group.images.map((img) => img.imagePath)
    );

    // Delete images from storage
    if (allImagePaths.length > 0) {
        const bucketName = `${defaultBucket}/scoreboards`;
        await supabaseClient.storage.from(bucketName).remove(allImagePaths);
    }

    // Delete groups from database (older than 1 week)
    const result = await prisma.recentMatchGroup.deleteMany({
        where: {
            createdAt: {
                lt: oneWeekAgo,
            },
        },
    });

    return { deleted: result.count };
}
