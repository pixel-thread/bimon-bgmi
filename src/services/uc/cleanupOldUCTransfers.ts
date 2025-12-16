import { prisma } from "@/src/lib/db/prisma";

/**
 * Cleans up old UC transfer records that are no longer pending.
 * Deletes APPROVED, REJECTED, and COMPLETED transfers older than 1 week.
 */
export async function cleanupOldUCTransfers() {
    // Calculate date 1 week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Delete old non-pending UC transfers
    const result = await prisma.uCTransfer.deleteMany({
        where: {
            createdAt: {
                lt: oneWeekAgo,
            },
            status: {
                not: "PENDING", // Only delete completed/approved/rejected requests
            },
        },
    });

    return { deleted: result.count };
}
