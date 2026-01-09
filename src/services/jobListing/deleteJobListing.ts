import { prisma } from "@/src/lib/db/prisma";

/**
 * Delete a job listing (only if owned by the player)
 */
export async function deleteJobListing(id: string, playerId: string) {
    // Verify ownership
    const existingListing = await prisma.playerJobListing.findFirst({
        where: {
            id,
            playerId,
        },
    });

    if (!existingListing) {
        throw new Error("Job listing not found or not owned by you");
    }

    return prisma.playerJobListing.delete({
        where: {
            id,
        },
    });
}
