import { distributeWinnerUC } from "@/src/services/winner/distributeWinnerUC";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await superAdminMiddleware(req);
        const tournamentId = (await params).id;

        const body = await req.json();
        const { placements } = body as {
            placements: { position: number; amount: number }[];
        };

        if (!placements || placements.length === 0) {
            return ErrorResponse({ message: "Placements are required" });
        }

        const result = await distributeWinnerUC({
            tournamentId,
            placements,
        });

        return SuccessResponse({
            message: "UC distributed successfully",
            data: result,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
