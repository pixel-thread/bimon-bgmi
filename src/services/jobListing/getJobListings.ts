import { prisma } from "@/src/lib/db/prisma";

/**
 * Get all active job listings for the banner (excludes banned ones)
 */
export async function getJobListings() {
    return prisma.playerJobListing.findMany({
        where: {
            isActive: true,
            isJobBanned: false,  // Don't show banned listings
        },
        include: {
            player: {
                include: {
                    user: {
                        select: {
                            displayName: true,
                            userName: true,
                            clerkId: true,
                        },
                    },
                    characterImage: {
                        select: {
                            publicUrl: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
