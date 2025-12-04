import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// GET - Get user's UC transfers
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId || user?.player?.id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const transfers = await prisma.uCTransfer.findMany({
            where: {
                OR: [{ fromPlayerId: playerId }, { toPlayerId: playerId }],
            },
            include: {
                fromPlayer: {
                    include: { user: { select: { userName: true } } },
                },
                toPlayer: {
                    include: { user: { select: { userName: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return SuccessResponse({
            data: transfers,
            message: "Transfers fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Create a new UC transfer (request or send)
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);
        const playerId = user?.playerId || user?.player?.id;

        if (!playerId) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const body = await req.json();
        const { amount, type, toPlayerId, message } = body;

        if (!amount || amount <= 0) {
            return ErrorResponse({ message: "Invalid amount", status: 400 });
        }

        if (!toPlayerId) {
            return ErrorResponse({ message: "Recipient player is required", status: 400 });
        }

        if (playerId === toPlayerId) {
            return ErrorResponse({ message: "Cannot transfer to yourself", status: 400 });
        }

        // Get the recipient player
        const toPlayer = await prisma.player.findUnique({
            where: { id: toPlayerId },
            include: { user: true, uc: true },
        });

        if (!toPlayer) {
            return ErrorResponse({ message: "Recipient player not found", status: 404 });
        }

        // Get the sender's UC balance
        const fromPlayer = await prisma.player.findUnique({
            where: { id: playerId },
            include: { uc: true, user: true },
        });

        if (!fromPlayer) {
            return ErrorResponse({ message: "Sender player not found", status: 404 });
        }

        // For SEND type, process immediately if sender has enough balance
        if (type === "SEND") {
            if (!fromPlayer.uc || fromPlayer.uc.balance < amount) {
                return ErrorResponse({ message: "Insufficient UC balance", status: 400 });
            }

            // Create transfer and update balances in transaction
            const transfer = await prisma.$transaction(async (tx) => {
                // Deduct from sender
                await tx.uC.update({
                    where: { playerId },
                    data: { balance: { decrement: amount } },
                });

                // Add to recipient (create UC if doesn't exist)
                if (toPlayer.uc) {
                    await tx.uC.update({
                        where: { playerId: toPlayerId },
                        data: { balance: { increment: amount } },
                    });
                } else {
                    await tx.uC.create({
                        data: {
                            balance: amount,
                            playerId: toPlayerId,
                            userId: toPlayer.userId,
                        },
                    });
                }

                // Create the transfer record
                const newTransfer = await tx.uCTransfer.create({
                    data: {
                        amount,
                        type: "SEND",
                        status: "COMPLETED",
                        message,
                        fromPlayerId: playerId,
                        toPlayerId,
                    },
                });

                // Create notification for recipient
                await tx.notification.create({
                    data: {
                        title: "UC Received",
                        message: `${fromPlayer.user.userName} sent you ${amount} UC`,
                        type: "uc_received",
                        playerId: toPlayerId,
                        link: "/profile",
                    },
                });

                return newTransfer;
            });

            return SuccessResponse({
                data: transfer,
                message: `Successfully sent ${amount} UC to ${toPlayer.user.userName}`,
            });
        }

        // For REQUEST type, create pending request
        if (type === "REQUEST") {
            const transfer = await prisma.$transaction(async (tx) => {
                const newTransfer = await tx.uCTransfer.create({
                    data: {
                        amount,
                        type: "REQUEST",
                        status: "PENDING",
                        message,
                        fromPlayerId: playerId,
                        toPlayerId,
                    },
                });

                // Create notification for recipient to approve/reject
                await tx.notification.create({
                    data: {
                        title: "UC Request",
                        message: `${fromPlayer?.user.userName} requested ${amount} UC from you`,
                        type: "uc_request",
                        playerId: toPlayerId,
                        link: "/profile",
                    },
                });

                return newTransfer;
            });

            return SuccessResponse({
                data: transfer,
                message: `UC request sent to ${toPlayer.user.userName}`,
            });
        }

        return ErrorResponse({ message: "Invalid transfer type", status: 400 });
    } catch (error) {
        return handleApiErrors(error);
    }
}
