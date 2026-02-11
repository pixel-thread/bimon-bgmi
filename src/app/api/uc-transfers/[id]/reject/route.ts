import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { sendPushToPlayer } from "@/src/services/push/sendPushToPlayer";

// PATCH - Reject a UC transfer request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;
        const transferId = (await params).id;

        // Parse optional response message
        let responseMessage: string | undefined;
        try {
            const body = await req.json();
            responseMessage = body?.responseMessage || undefined;
        } catch {
            // No body or invalid JSON is fine
        }

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
                data: { status: "REJECTED", responseMessage },
            });

            // Update the original uc_request notification to show rejected state
            // Match by type, playerId (recipient), and message content containing the amount
            await tx.notification.updateMany({
                where: {
                    type: "uc_request",
                    playerId: transfer.toPlayerId,
                    message: { contains: `${transfer.amount} UC` },
                },
                data: {
                    type: "uc_request_rejected",
                    title: "UC Request Rejected",
                    isRead: true,
                },
            });

            // Notify the requester
            const rejecterName = transfer.toPlayer.user.displayName || transfer.toPlayer.user.userName;
            const rejectMsg = responseMessage
                ? `${rejecterName} rejected your request for ${transfer.amount} UC: "${responseMessage}"`
                : `${rejecterName} rejected your request for ${transfer.amount} UC`;
            await tx.notification.create({
                data: {
                    title: "UC Request Rejected",
                    message: rejectMsg,
                    type: "uc_rejected",
                    playerId: transfer.fromPlayerId,
                    link: "/profile",
                },
            });

            // Send push notification to requester (async, non-blocking)
            sendPushToPlayer(transfer.fromPlayerId, {
                title: "UC Request Rejected ❌",
                body: rejectMsg,
                url: "/profile",
            }).catch((error) => {
                console.error("Failed to send push notification:", error);
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
