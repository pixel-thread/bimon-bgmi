import { prisma } from "@/src/lib/db/prisma";

/**
 * Get all job listings for a specific player
 */
export async function getMyJobListings(playerId: string) {
    return prisma.playerJobListing.findMany({
        where: {
            playerId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
