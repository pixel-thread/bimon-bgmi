import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// GET - Get count of pending UC requests for the current user
// This is a lightweight endpoint for the notification badge
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId || user?.player?.id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Count only pending requests where current user is the recipient
        const count = await prisma.uCTransfer.count({
            where: {
                toPlayerId: playerId,
                type: "REQUEST",
                status: "PENDING",
            },
        });

        return SuccessResponse({
            data: { count },
            message: "Pending count fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
