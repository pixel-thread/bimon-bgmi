import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { clearPlayerStatusOnBalanceRecovery } from "@/src/services/player/balanceRecovery";
import { sendPushToPlayer } from "@/src/services/push/sendPushToPlayer";

// PATCH - Approve a UC transfer request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId;
        const transferId = (await params).id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get the transfer
        const transfer = await prisma.uCTransfer.findUnique({
            where: { id: transferId },
            include: {
                fromPlayer: { include: { user: true, uc: true } },
                toPlayer: { include: { user: true, uc: true } },
            },
        });

        if (!transfer) {
            return ErrorResponse({ message: "Transfer not found", status: 404 });
        }

        if (transfer.status !== "PENDING") {
            return ErrorResponse({ message: "Transfer is not pending", status: 400 });
        }

        // Only the recipient (toPlayer) can approve a request
        if (transfer.toPlayerId !== playerId) {
            return ErrorResponse({ message: "Not authorized to approve this transfer", status: 403 });
        }

        // Check if approver has enough balance
        if (!transfer.toPlayer.uc || transfer.toPlayer.uc.balance < transfer.amount) {
            return ErrorResponse({ message: "Insufficient UC balance to approve", status: 400 });
        }

        // Process approval in transaction
        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Deduct from approver (toPlayer)
            await tx.uC.update({
                where: { playerId: transfer.toPlayerId },
                data: { balance: { decrement: transfer.amount } },
            });

            await tx.transaction.create({
                data: {
                    amount: transfer.amount,
                    type: "debit",
                    description: `UC Transfer to ${transfer.fromPlayer.user.displayName || transfer.fromPlayer.user.userName}`,
                    playerId: transfer.toPlayerId,
                },
            });

            // Add to requester (fromPlayer)
            if (transfer.fromPlayer.uc) {
                await tx.uC.update({
                    where: { playerId: transfer.fromPlayerId },
                    data: { balance: { increment: transfer.amount } },
                });
            } else {
                await tx.uC.create({
                    data: {
                        balance: transfer.amount,
                        playerId: transfer.fromPlayerId,
                        userId: transfer.fromPlayer.userId,
                    },
                });
            }

            await tx.transaction.create({
                data: {
                    amount: transfer.amount,
                    type: "credit",
                    description: `UC Transfer from ${transfer.toPlayer.user.displayName || transfer.toPlayer.user.userName}`,
                    playerId: transfer.fromPlayerId,
                },
            });

            // Update transfer status
            const updated = await tx.uCTransfer.update({
                where: { id: transferId },
                data: { status: "APPROVED" },
            });

            // Update the original uc_request notification to show approved state
            // Match by type, playerId (recipient), and message content containing the amount
            await tx.notification.updateMany({
                where: {
                    type: "uc_request",
                    playerId: transfer.toPlayerId,
                    message: { contains: `${transfer.amount} UC` },
                },
                data: {
                    type: "uc_request_approved",
                    title: "UC Request Approved",
                    isRead: true,
                },
            });

            // Notify the requester
            const approverName = transfer.toPlayer.user.displayName || transfer.toPlayer.user.userName;
            await tx.notification.create({
                data: {
                    title: "UC Request Approved",
                    message: `${approverName} approved your request for ${transfer.amount} UC`,
                    type: "uc_approved",
                    playerId: transfer.fromPlayerId,
                    link: "/profile",
                },
            });

            // Send push notification to requester (async, non-blocking)
            sendPushToPlayer(transfer.fromPlayerId, {
                title: "UC Request Approved! ✅",
                body: `${approverName} approved your request for ${transfer.amount} UC`,
                url: "/profile",
            }).catch((error) => {
                console.error("Failed to send push notification:", error);
            });

            // Clear trusted status if balance recovered for both players
            // (bans are admin-controlled only, not affected by balance)

            // Fetch current balances
            const senderUc = await tx.uC.findUnique({ where: { playerId: transfer.fromPlayerId } });
            const receiverUc = await tx.uC.findUnique({ where: { playerId: transfer.toPlayerId } });

            if (senderUc) {
                await clearPlayerStatusOnBalanceRecovery(transfer.fromPlayerId, senderUc.balance, tx);
            }
            if (receiverUc) {
                await clearPlayerStatusOnBalanceRecovery(transfer.toPlayerId, receiverUc.balance, tx);
            }

            return updated;
        });

        return SuccessResponse({
            data: updatedTransfer,
            message: "Transfer approved successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
