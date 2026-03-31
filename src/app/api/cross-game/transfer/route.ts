import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/database";
import { getAvailableBalance } from "@/lib/wallet-service";
import { getGameConfig, GAME_CONFIGS, type GameMode } from "@/lib/game-config";
import { communityDb } from "@/lib/community-db";

/**
 * POST /api/cross-game/transfer
 * Self-transfer currency between games.
 * 
 * Body: { amount: number, targetGame: string }
 * 
 * IMPORTANT: Uses getGameConfig(req) to detect the SOURCE game from the
 * request's x-game-mode header (set by proxy). Module-level GAME_MODE
 * would always resolve to "bgmi" on the server.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.email || !user?.player) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Detect source game from request headers (NOT module-level GAME_MODE)
        const { GAME, GAME_MODE: sourceGameMode } = getGameConfig(req);

        const body = await req.json();
        const { amount, targetGame } = body as { amount: number; targetGame: GameMode };

        // ── Validations ─────────────────────────────────────────
        if (!amount || amount <= 0 || !Number.isInteger(amount)) {
            return NextResponse.json({ error: "Amount must be a positive integer" }, { status: 400 });
        }

        if (!targetGame || !(targetGame in GAME_CONFIGS)) {
            return NextResponse.json({ error: "Invalid target game" }, { status: 400 });
        }

        if (targetGame === sourceGameMode) {
            return NextResponse.json({ error: "Cannot transfer to the same game" }, { status: 400 });
        }

        // ── Check source balance ────────────────────────────────
        const { available, reserved } = await getAvailableBalance(user.email);
        if (available < amount) {
            const reservedNote = reserved > 0 ? ` (${reserved} ${GAME.currency} reserved for tournaments)` : "";
            return NextResponse.json(
                { error: `Insufficient balance. You have ${available} ${GAME.currency} available${reservedNote}.` },
                { status: 400 }
            );
        }

        // ── Check target account exists ─────────────────────────
        const targetDb = getPrisma(targetGame);
        const targetUser = await targetDb.user.findUnique({
            where: { email: user.email },
            include: { player: { include: { wallet: true } } },
        });

        if (!targetUser?.player) {
            return NextResponse.json(
                { error: `You don't have an account on ${GAME_CONFIGS[targetGame].gameName}. Sign up there first!` },
                { status: 400 }
            );
        }

        // ── Phase 1: Debit source game wallet ───────────────────
        const sourceDb = getPrisma(sourceGameMode);
        const sourcePlayer = await sourceDb.player.findFirst({
            where: { userId: user.id },
            include: { wallet: true },
        });

        if (!sourcePlayer) {
            return NextResponse.json({ error: "Source player not found" }, { status: 404 });
        }

        const sourceBalance = sourcePlayer.wallet?.balance ?? 0;
        const newSourceBalance = sourceBalance - amount;

        await sourceDb.$transaction([
            sourceDb.wallet.upsert({
                where: { playerId: sourcePlayer.id },
                create: { playerId: sourcePlayer.id, balance: newSourceBalance },
                update: { balance: newSourceBalance },
            }),
            sourceDb.transaction.create({
                data: {
                    playerId: sourcePlayer.id,
                    amount,
                    type: "DEBIT",
                    description: `Transfer to ${GAME_CONFIGS[targetGame].gameName}`,
                },
            }),
        ]);

        // ── Phase 2: Credit target game wallet ──────────────────
        try {
            const targetBalance = targetUser.player.wallet?.balance ?? 0;
            const newTargetBalance = targetBalance + amount;

            await targetDb.$transaction([
                targetDb.wallet.upsert({
                    where: { playerId: targetUser.player.id },
                    create: { playerId: targetUser.player.id, balance: newTargetBalance },
                    update: { balance: newTargetBalance },
                }),
                targetDb.transaction.create({
                    data: {
                        playerId: targetUser.player.id,
                        amount,
                        type: "CREDIT",
                        description: `Transfer from ${GAME.gameName}`,
                    },
                }),
            ]);
        } catch (creditError) {
            // ── AUTO-REFUND: Credit failed, reverse the debit ───
            console.error("[cross-game] Credit failed, refunding source:", creditError);

            await sourceDb.$transaction([
                sourceDb.wallet.update({
                    where: { playerId: sourcePlayer.id },
                    data: { balance: sourceBalance }, // restore original
                }),
                sourceDb.transaction.create({
                    data: {
                        playerId: sourcePlayer.id,
                        amount,
                        type: "CREDIT",
                        description: `Refund: failed transfer to ${GAME_CONFIGS[targetGame].gameName}`,
                    },
                }),
            ]);

            return NextResponse.json(
                { error: "Transfer failed. Your balance has been refunded." },
                { status: 500 }
            );
        }

        // ── Phase 3: Log settlement in community DB ─────────────
        try {
            await communityDb.crossGameTransfer.create({
                data: {
                    fromGame: sourceGameMode,
                    toGame: targetGame,
                    playerEmail: user.email,
                    amount,
                    description: `${GAME.gameName} → ${GAME_CONFIGS[targetGame].gameName}`,
                },
            });
        } catch (settlementError) {
            console.error("[cross-game] Settlement log failed (transfer still succeeded):", settlementError);
        }

        return NextResponse.json({
            success: true,
            message: `Transferred ${amount} ${GAME.currency} to your ${GAME_CONFIGS[targetGame].gameName} account`,
            data: {
                amount,
                fromGame: sourceGameMode,
                toGame: targetGame,
                newSourceBalance: newSourceBalance,
            },
        });
    } catch (error) {
        console.error("[POST /api/cross-game/transfer] Error:", error);
        return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
    }
}
