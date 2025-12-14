import { prisma } from "@/src/lib/db/prisma";

export async function getRecentMatchGroups() {
    return prisma.recentMatchGroup.findMany({
        include: {
            images: {
                orderBy: { matchNumber: "asc" },
            },
            tournament: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
