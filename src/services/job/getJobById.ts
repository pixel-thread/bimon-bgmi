import { prisma } from "@/src/lib/db/prisma";

export async function getJobById(id: string) {
    return prisma.job.findUnique({
        where: { id },
    });
}
