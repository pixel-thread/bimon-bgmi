import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/uc-transfers
 * Create a UC transfer (SEND or REQUEST) between players.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const playerId = user.player.id;
        const body = await req.json();
        const { amount, type, toPlayerId, message } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }
        if (!toPlayerId) {
            return NextResponse.json({ error: "Recipient required" }, { status: 400 });
        }
        if (playerId === toPlayerId) {
            return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
        }

        const toPlayer = await prisma.player.findUnique({
            where: { id: toPlayerId },
            include: { wallet: true, user: { select: { id: true, username: true, displayName: true } } },
        });
        if (!toPlayer) {
            return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
        }

        const fromPlayer = await prisma.player.findUnique({
            where: { id: playerId },
            include: { wallet: true, user: { select: { id: true, username: true, displayName: true } } },
        });
        if (!fromPlayer) {
            return NextResponse.json({ error: "Sender not found" }, { status: 404 });
        }

        const senderName = fromPlayer.displayName || fromPlayer.user.username;

        // SEND — immediate transfer
        if (type === "SEND") {
            const balance = fromPlayer.wallet?.balance ?? 0;
            if (balance < amount) {
                return NextResponse.json(
                    { error: `Insufficient balance. You have ${balance} UC.` },
                    { status: 400 }
                );
            }

            const transfer = await prisma.$transaction(async (tx) => {
                // Deduct from sender
                await tx.wallet.update({
                    where: { playerId },
                    data: { balance: { decrement: amount } },
                });

                // Add to recipient (upsert wallet)
                await tx.wallet.upsert({
                    where: { playerId: toPlayerId },
                    update: { balance: { increment: amount } },
                    create: { playerId: toPlayerId, balance: amount },
                });

                const created = await tx.uCTransfer.create({
                    data: {
                        amount,
                        type: "SEND",
                        status: "COMPLETED",
                        message: message || null,
                        fromPlayerId: playerId,
                        toPlayerId,
                    },
                });

                // Notify recipient
                await tx.notification.create({
                    data: {
                        title: "UC Received",
                        message: `${senderName} sent you ${amount} UC`,
                        type: "uc_received",
                        userId: toPlayer.user.id,
                        playerId: toPlayerId,
                        link: "/wallet",
                    },
                });

                return created;
            });

            const toName = toPlayer.displayName || toPlayer.user.username;
            return NextResponse.json({
                success: true,
                data: transfer,
                message: `Sent ${amount} UC to ${toName}`,
            });
        }

        // REQUEST — create pending request
        if (type === "REQUEST") {
            const transfer = await prisma.$transaction(async (tx) => {
                const created = await tx.uCTransfer.create({
                    data: {
                        amount,
                        type: "REQUEST",
                        status: "PENDING",
                        message: message || null,
                        fromPlayerId: playerId,
                        toPlayerId,
                    },
                });

                // Notify recipient (person being asked)
                await tx.notification.create({
                    data: {
                        title: "UC Request",
                        message: `${senderName} requested ${amount} UC from you`,
                        type: "uc_request",
                        userId: toPlayer.user.id,
                        playerId: toPlayerId,
                        link: "/notifications",
                    },
                });

                return created;
            });

            const toName = toPlayer.displayName || toPlayer.user.username;
            return NextResponse.json({
                success: true,
                data: transfer,
                message: `Requested ${amount} UC from ${toName}`,
            });
        }

        return NextResponse.json({ error: "Invalid transfer type" }, { status: 400 });
    } catch (error) {
        console.error("UC transfer error:", error);
        return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
    }
}
