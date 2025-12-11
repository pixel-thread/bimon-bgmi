import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { checkAndApplyAutoBan } from "@/src/services/player/autoBan";

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
                    description: `UC Transfer to ${transfer.fromPlayer.user.userName}`,
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
                    description: `UC Transfer from ${transfer.toPlayer.user.userName}`,
                    playerId: transfer.fromPlayerId,
                },
            });

            // Update transfer status
            const updated = await tx.uCTransfer.update({
                where: { id: transferId },
                data: { status: "APPROVED" },
            });

            // Notify the requester
            await tx.notification.create({
                data: {
                    title: "UC Request Approved",
                    message: `${transfer.toPlayer.user.userName} approved your request for ${transfer.amount} UC`,
                    type: "uc_approved",
                    playerId: transfer.fromPlayerId,
                    link: "/profile",
                },
            });

            // Check for auto-ban for both players
            // Sender (requester) received UC, so check if they can be unbanned (or banned if somehow balance is low, though unlikely on receive)
            // Receiver (approver) sent UC, so check if they need to be banned

            // We need current balances. 
            // We can fetch them or calculate. 
            // Let's fetch to be safe and simple inside tx.
            const senderUc = await tx.uC.findUnique({ where: { playerId: transfer.fromPlayerId } });
            const receiverUc = await tx.uC.findUnique({ where: { playerId: transfer.toPlayerId } });

            if (senderUc) {
                await checkAndApplyAutoBan(transfer.fromPlayerId, senderUc.balance, tx);
            }
            if (receiverUc) {
                await checkAndApplyAutoBan(transfer.toPlayerId, receiverUc.balance, tx);
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
