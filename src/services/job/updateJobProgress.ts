import { prisma } from "@/src/lib/db/prisma";
import { JobStatus } from "@/src/lib/db/prisma/generated/prisma";

interface UpdateJobProgressParams {
    jobId: string;
    progress?: string;
    status?: JobStatus;
    result?: object;
    error?: string;
}

export async function updateJobProgress({
    jobId,
    progress,
    status,
    result,
    error,
}: UpdateJobProgressParams) {
    const data: {
        progress?: string;
        status?: JobStatus;
        result?: object;
        error?: string;
        startedAt?: Date;
        completedAt?: Date;
    } = {};

    if (progress !== undefined) data.progress = progress;
    if (status !== undefined) data.status = status;
    if (result !== undefined) data.result = result;
    if (error !== undefined) data.error = error;

    // Set startedAt when status changes to PROCESSING
    if (status === JobStatus.PROCESSING) {
        data.startedAt = new Date();
    }

    // Set completedAt when status changes to COMPLETED or FAILED
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
        data.completedAt = new Date();
    }

    return prisma.job.update({
        where: { id: jobId },
        data,
    });
}
