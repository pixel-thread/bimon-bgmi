import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

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
                        user: { select: { id: true, username: true, displayName: true } },
                    },
                },
                toPlayer: {
                    include: {
                        wallet: true,
                        user: { select: { id: true, username: true, displayName: true } },
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

        // Check balance
        const approverBalance = transfer.toPlayer.wallet?.balance ?? 0;
        if (approverBalance < transfer.amount) {
            return NextResponse.json(
                { error: `Insufficient balance. You have ${approverBalance} UC.` },
                { status: 400 }
            );
        }

        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Deduct from approver (toPlayer)
            await tx.wallet.update({
                where: { playerId: transfer.toPlayerId },
                data: { balance: { decrement: transfer.amount } },
            });

            // Add to requester (fromPlayer) — upsert wallet
            await tx.wallet.upsert({
                where: { playerId: transfer.fromPlayerId },
                update: { balance: { increment: transfer.amount } },
                create: { playerId: transfer.fromPlayerId, balance: transfer.amount },
            });

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
                    message: { contains: `${transfer.amount} UC` },
                },
                data: {
                    type: "uc_request_approved",
                    title: "UC Request Approved",
                    isRead: true,
                },
            });

            // Notify the requester
            const approverName = transfer.toPlayer.displayName || transfer.toPlayer.user.username;
            const approveMsg = responseMessage
                ? `${approverName} approved your request for ${transfer.amount} UC: "${responseMessage}"`
                : `${approverName} approved your request for ${transfer.amount} UC`;

            await tx.notification.create({
                data: {
                    title: "UC Request Approved",
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
