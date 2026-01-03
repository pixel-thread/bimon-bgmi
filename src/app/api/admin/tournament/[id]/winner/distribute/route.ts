import { distributeWinnerUC } from "@/src/services/winner/distributeWinnerUC";
import { prisma } from "@/src/lib/db/prisma";
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
        const { playerAmounts } = body as {
            playerAmounts: { playerId: string; amount: number }[];
        };

        if (!playerAmounts || playerAmounts.length === 0) {
            return ErrorResponse({ message: "Player amounts are required" });
        }

        const result = await distributeWinnerUC({
            tournamentId,
            playerAmounts,
        });

        // Auto-set tournament to INACTIVE after UC distribution
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: "INACTIVE" },
        });

        return SuccessResponse({
            message: "UC distributed successfully. Tournament marked as complete.",
            data: result,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
