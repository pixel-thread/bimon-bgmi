import { getJobById } from "@/src/services/job/getJobById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await adminMiddleware(req);
        const { id } = await params;

        const job = await getJobById(id);

        if (!job) {
            return ErrorResponse({
                message: "Job not found",
                status: 404,
            });
        }

        return SuccessResponse({
            data: {
                id: job.id,
                type: job.type,
                status: job.status,
                progress: job.progress,
                result: job.result,
                error: job.error,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
            },
            message: "Job status retrieved",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
