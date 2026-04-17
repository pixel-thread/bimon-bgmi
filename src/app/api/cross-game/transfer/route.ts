import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/database";
import { getAvailableBalance } from "@/lib/wallet-service";
import { GAME_CONFIGS, type GameMode } from "@/lib/game-config";
import { communityDb } from "@/lib/community-db";

/**
 * POST /api/cross-game/transfer
 * Self-transfer currency between games.
 * 
 * Body: { amount: number, targetGame: string }
 * 
 * IMPORTANT: Uses next/headers to read x-game-mode set by proxy middleware.
 * req.headers does NOT contain middleware-modified headers in Next.js.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.email || !user?.player) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Detect source game from middleware headers (NOT req.headers or module-level GAME_MODE)
        const headerStore = await headers();
        const sourceGameMode = (headerStore.get("x-game-mode") as GameMode) || (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";
        const GAME = GAME_CONFIGS[sourceGameMode] || GAME_CONFIGS.bgmi;

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

        // ── Anti-abuse: Short cooldown (1 min between transfers) ─
        // No daily cap needed — exchange rate math guarantees every
        // round-trip LOSES currency (e.g. 100 UC → 90 BP → 81 UC)
        const COOLDOWN_SECONDS = 60;

        try {
            const cooldownSince = new Date(Date.now() - COOLDOWN_SECONDS * 1000);
            const recentTransfer = await communityDb.crossGameTransfer.findFirst({
                where: {
                    playerEmail: user.email,
                    createdAt: { gte: cooldownSince },
                },
                orderBy: { createdAt: "desc" },
            });

            if (recentTransfer) {
                const waitSec = Math.ceil((recentTransfer.createdAt.getTime() + COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
                return NextResponse.json(
                    { error: `Please wait ${waitSec}s before your next transfer` },
                    { status: 429 }
                );
            }
        } catch (abuseCheckError) {
            console.warn("[cross-game] Cooldown check failed, proceeding:", abuseCheckError);
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
        const targetUser = await targetDb.user.findFirst({
            where: { OR: [{ email: user.email }, { secondaryEmail: user.email }] },
            include: { player: { include: { wallet: true } } },
        });

        if (!targetUser?.player) {
            return NextResponse.json(
                { error: `You don't have an account on ${GAME_CONFIGS[targetGame].gameName}. Sign up there first!` },
                { status: 400 }
            );
        }

        // ── Compute exchange rate & validate clean amount ────────
        const targetConfig = GAME_CONFIGS[targetGame];
        const sourceOutRate = GAME.exchangeRateOut ?? 1;
        const targetInRate = targetConfig.exchangeRateIn ?? 1;
        const combinedRate = sourceOutRate * targetInRate;
        const hasConversion = Math.abs(combinedRate - 1) > 0.001;

        // Find minimum step for zero-rounding transfers
        // e.g. rate 0.9 → step 10, rate 10/9 → step 9, rate 1.0 → step 1
        let transferStep = 1;
        if (hasConversion) {
            for (let n = 1; n <= 100; n++) {
                const result = n * combinedRate;
                if (Math.abs(result - Math.round(result)) < 0.0001) {
                    transferStep = n;
                    break;
                }
            }
        }

        if (hasConversion && amount % transferStep !== 0) {
            return NextResponse.json(
                { error: `Amount must be a multiple of ${transferStep} for ${GAME.gameName} → ${targetConfig.gameName} transfers` },
                { status: 400 }
            );
        }

        const creditAmount = Math.round(amount * combinedRate);

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
            const newTargetBalance = targetBalance + creditAmount;

            await targetDb.$transaction([
                targetDb.wallet.upsert({
                    where: { playerId: targetUser.player.id },
                    create: { playerId: targetUser.player.id, balance: newTargetBalance },
                    update: { balance: newTargetBalance },
                }),
                targetDb.transaction.create({
                    data: {
                        playerId: targetUser.player.id,
                        amount: creditAmount,
                        type: "CREDIT",
                        description: hasConversion
                            ? `Transfer from ${GAME.gameName} (${amount} ${GAME.currency} → ${creditAmount} ${targetConfig.entryCurrency || targetConfig.currency})`
                            : `Transfer from ${GAME.gameName}`,
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
                    description: hasConversion
                        ? `${GAME.gameName} → ${targetConfig.gameName} (${amount} ${GAME.currency} → ${creditAmount} ${targetConfig.entryCurrency || targetConfig.currency})`
                        : `${GAME.gameName} → ${targetConfig.gameName}`,
                },
            });
        } catch (settlementError) {
            console.error("[cross-game] Settlement log failed (transfer still succeeded):", settlementError);
        }

        const targetCurrencyLabel = targetConfig.entryCurrency || targetConfig.currency;
        const sourceCurrencyLabel = GAME.entryCurrency || GAME.currency;
        const message = hasConversion
            ? `Transferred ${amount} ${sourceCurrencyLabel} → ${creditAmount} ${targetCurrencyLabel} to your ${targetConfig.gameName} account`
            : `Transferred ${amount} ${sourceCurrencyLabel} to your ${targetConfig.gameName} account`;

        return NextResponse.json({
            success: true,
            message,
            data: {
                amount,
                creditAmount,
                combinedRate,
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
