import { prisma } from "@/src/lib/db/prisma";
import { JobType, JobStatus } from "@/src/lib/db/prisma/generated/prisma";

interface CreateJobParams {
    type: JobType;
    pollId?: string;
    createdBy: string;
}

export async function createJob({ type, pollId, createdBy }: CreateJobParams) {
    return prisma.job.create({
        data: {
            type,
            pollId,
            createdBy,
            status: JobStatus.PENDING,
            progress: "Initializing...",
        },
    });
}
