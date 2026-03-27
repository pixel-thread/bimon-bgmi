import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { GAME } from "@/lib/game-config";
import { getAvailableBalance, transferCentralWallet, getEmailByPlayerId } from "@/lib/wallet-service";

/**
 * PATCH /api/uc-transfers/[id]/approve
 * Approve a pending UC request. Only the toPlayer can approve.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const playerId = user.player.id;
        const transferId = (await params).id;

        // Parse optional response message
        let responseMessage: string | undefined;
        try {
            const body = await req.json();
            responseMessage = body?.responseMessage || undefined;
        } catch {
            // No body is fine
        }

        // Get the transfer with player & wallet info
        const transfer = await prisma.uCTransfer.findUnique({
            where: { id: transferId },
            include: {
                fromPlayer: {
                    include: {
                        wallet: true,
                        user: { select: { id: true, username: true } },
                    },
                },
                toPlayer: {
                    include: {
                        wallet: true,
                        user: { select: { id: true, username: true } },
                    },
                },
            },
        });

        if (!transfer) {
            return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
        }
        if (transfer.status !== "PENDING") {
            return NextResponse.json({ error: "Transfer is not pending" }, { status: 400 });
        }
        if (transfer.toPlayerId !== playerId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Check central wallet balance
        const approverEmail = await getEmailByPlayerId(transfer.toPlayerId);
        const requesterEmail = await getEmailByPlayerId(transfer.fromPlayerId);
        if (!approverEmail || !requesterEmail) {
            return NextResponse.json({ error: "Could not resolve emails" }, { status: 400 });
        }

        const { available, reserved } = await getAvailableBalance(approverEmail);
        if (available < transfer.amount) {
            const reservedNote = reserved > 0 ? ` (${reserved} ${GAME.currency} reserved for tournaments)` : "";
            return NextResponse.json(
                { error: `Insufficient balance. You have ${available} ${GAME.currency} available${reservedNote}.` },
                { status: 400 }
            );
        }

        const txApproverName = transfer.toPlayer.displayName || transfer.toPlayer.user.username;
        const txRequesterName = transfer.fromPlayer.displayName || transfer.fromPlayer.user.username;

        // Transfer via central wallet
        await transferCentralWallet(
            approverEmail,
            requesterEmail,
            transfer.amount,
            `UC Request approved: ${txApproverName} → ${txRequesterName}`,
        );

        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Update transfer status
            const updated = await tx.uCTransfer.update({
                where: { id: transferId },
                data: { status: "APPROVED", responseMessage },
            });

            // Update original uc_request notification to approved
            await tx.notification.updateMany({
                where: {
                    type: "uc_request",
                    userId: transfer.toPlayer.user.id,
                    message: { contains: `${transfer.amount} ${GAME.currency}` },
                },
                data: {
                    type: "uc_request_approved",
                    title: `${GAME.currency} Request Approved`,
                    isRead: true,
                },
            });

            // Notify the requester
            const approverName = transfer.toPlayer.displayName || transfer.toPlayer.user.username;
            const approveMsg = responseMessage
                ? `${approverName} approved your request for ${transfer.amount} ${GAME.currency}: "${responseMessage}"`
                : `${approverName} approved your request for ${transfer.amount} ${GAME.currency}`;

            await tx.notification.create({
                data: {
                    title: `${GAME.currency} Request Approved`,
                    message: approveMsg,
                    type: "uc_approved",
                    userId: transfer.fromPlayer.user.id,
                    playerId: transfer.fromPlayerId,
                    link: "/wallet",
                },
            });

            return updated;
        });

        return NextResponse.json({
            success: true,
            data: updatedTransfer,
            message: "Transfer approved successfully",
        });
    } catch (error) {
        console.error("Approve transfer error:", error);
        return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
    }
}
