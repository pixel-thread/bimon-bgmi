import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// PATCH - Reject a UC transfer request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId || user?.player?.id;
        const transferId = (await params).id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get the transfer
        const transfer = await prisma.uCTransfer.findUnique({
            where: { id: transferId },
            include: {
                fromPlayer: { include: { user: true } },
                toPlayer: { include: { user: true } },
            },
        });

        if (!transfer) {
            return ErrorResponse({ message: "Transfer not found", status: 404 });
        }

        if (transfer.status !== "PENDING") {
            return ErrorResponse({ message: "Transfer is not pending", status: 400 });
        }

        // Only the recipient (toPlayer) can reject a request
        if (transfer.toPlayerId !== playerId) {
            return ErrorResponse({ message: "Not authorized to reject this transfer", status: 403 });
        }

        // Process rejection in transaction
        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Update transfer status
            const updated = await tx.uCTransfer.update({
                where: { id: transferId },
                data: { status: "REJECTED" },
            });

            // Notify the requester
            await tx.notification.create({
                data: {
                    title: "UC Request Rejected",
                    message: `${transfer.toPlayer.user.userName} rejected your request for ${transfer.amount} UC`,
                    type: "uc_rejected",
                    playerId: transfer.fromPlayerId,
                    link: "/profile",
                },
            });

            return updated;
        });

        return SuccessResponse({
            data: updatedTransfer,
            message: "Transfer rejected",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
