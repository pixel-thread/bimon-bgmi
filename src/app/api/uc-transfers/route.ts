import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { GAME } from "@/lib/game-config";
import { getAvailableBalance, transferWallet, getEmailByPlayerId } from "@/lib/wallet-service";

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
            include: { wallet: true, user: { select: { id: true, username: true, role: true } } },
        });
        if (!toPlayer) {
            return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
        }

        // Block transfers to/from admin players
        if (toPlayer.user.role === "SUPER_ADMIN" || toPlayer.user.role === "ADMIN") {
            return NextResponse.json({ error: "Cannot transfer to admin accounts" }, { status: 403 });
        }

        const fromPlayer = await prisma.player.findUnique({
            where: { id: playerId },
            include: { wallet: true, user: { select: { id: true, username: true } } },
        });
        if (!fromPlayer) {
            return NextResponse.json({ error: "Sender not found" }, { status: 404 });
        }

        const senderName = fromPlayer.displayName || fromPlayer.user.username;

        // SEND — immediate transfer via central wallet
        if (type === "SEND") {
            const senderEmail = await getEmailByPlayerId(playerId);
            const recipientEmail = await getEmailByPlayerId(toPlayerId);
            if (!senderEmail || !recipientEmail) {
                return NextResponse.json({ error: "Could not resolve emails" }, { status: 400 });
            }

            const { available, reserved } = await getAvailableBalance(senderEmail);
            if (available < amount) {
                const reservedNote = reserved > 0 ? ` (${reserved} ${GAME.currency} reserved for tournaments)` : "";
                return NextResponse.json(
                    { error: `Insufficient balance. You have ${available} ${GAME.currency} available${reservedNote}.` },
                    { status: 400 }
                );
            }

            const toName = toPlayer.displayName || toPlayer.user.username;

            // Transfer via central wallet
            await transferWallet(
                senderEmail,
                recipientEmail,
                amount,
                `Transfer: ${senderName} → ${toName}`,
            );

            // Game DB audit + sync
            const transfer = await prisma.$transaction(async (tx) => {
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

                await tx.notification.create({
                    data: {
                        title: `${GAME.currency} Received`,
                        message: `${senderName} sent you ${amount} ${GAME.currency}`,
                        type: "uc_received",
                        userId: toPlayer.user.id,
                        playerId: toPlayerId,
                        link: "/wallet",
                    },
                });

                return created;
            });

            return NextResponse.json({
                success: true,
                data: transfer,
                message: `Sent ${amount} ${GAME.currency} to ${toName}`,
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
                        title: `${GAME.currency} Request`,
                        message: `${senderName} requested ${amount} ${GAME.currency} from you`,
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
                message: `Requested ${amount} ${GAME.currency} from ${toName}`,
            });
        }

        return NextResponse.json({ error: "Invalid transfer type" }, { status: 400 });
    } catch (error) {
        console.error(`${GAME.currency} transfer error:`, error);
        return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
    }
}
