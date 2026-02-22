import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * PATCH /api/uc-transfers/[id]/reject
 * Reject a pending UC request. Only the toPlayer can reject.
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

        // Get the transfer
        const transfer = await prisma.uCTransfer.findUnique({
            where: { id: transferId },
            include: {
                fromPlayer: {
                    include: {
                        user: { select: { id: true, username: true, displayName: true } },
                    },
                },
                toPlayer: {
                    include: {
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

        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Update transfer status
            const updated = await tx.uCTransfer.update({
                where: { id: transferId },
                data: { status: "REJECTED", responseMessage },
            });

            // Update original uc_request notification to rejected
            await tx.notification.updateMany({
                where: {
                    type: "uc_request",
                    userId: transfer.toPlayer.user.id,
                    message: { contains: `${transfer.amount} UC` },
                },
                data: {
                    type: "uc_request_rejected",
                    title: "UC Request Rejected",
                    isRead: true,
                },
            });

            // Notify the requester
            const rejecterName = transfer.toPlayer.displayName || transfer.toPlayer.user.username;
            const rejectMsg = responseMessage
                ? `${rejecterName} rejected your request for ${transfer.amount} UC: "${responseMessage}"`
                : `${rejecterName} rejected your request for ${transfer.amount} UC`;

            await tx.notification.create({
                data: {
                    title: "UC Request Rejected",
                    message: rejectMsg,
                    type: "uc_rejected",
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
            message: "Transfer rejected",
        });
    } catch (error) {
        console.error("Reject transfer error:", error);
        return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
    }
}
