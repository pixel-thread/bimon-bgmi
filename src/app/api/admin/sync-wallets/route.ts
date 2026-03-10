import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { walletDb } from "@/lib/wallet-db";

/**
 * POST /api/admin/sync-wallets
 * One-time migration: sync local wallet balances → central wallet.
 * For players whose local balance > central balance, adds the difference.
 * SUPER_ADMIN only.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (user?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

        // Get all local wallets with player + user email
        const localWallets = await prisma.wallet.findMany({
            include: {
                player: {
                    include: {
                        user: { select: { email: true, role: true } },
                    },
                },
            },
        });

        const results: Array<{
            email: string;
            displayName: string;
            localBalance: number;
            centralBalance: number;
            diff: number;
            action: string;
        }> = [];

        const GAME_MODE = process.env.NEXT_PUBLIC_GAME_MODE || "bgmi";

        for (const lw of localWallets) {
            const email = lw.player?.user?.email;
            if (!email) continue;

            // Skip admins
            if (lw.player?.user?.role === "SUPER_ADMIN" || lw.player?.user?.role === "ADMIN") {
                continue;
            }

            const localBalance = lw.balance;

            // Get central wallet balance
            const centralUser = await walletDb.centralUser.findUnique({
                where: { email },
                include: { wallet: true },
            });

            const centralBalance = centralUser?.wallet?.balance ?? 0;
            const diff = localBalance - centralBalance;

            if (diff === 0) {
                results.push({
                    email,
                    displayName: lw.player?.displayName || "Unknown",
                    localBalance,
                    centralBalance,
                    diff: 0,
                    action: "ALREADY_SYNCED",
                });
                continue;
            }

            if (!dryRun) {
                if (!centralUser) {
                    // Create central user + wallet
                    await walletDb.centralUser.create({
                        data: {
                            email,
                            name: lw.player?.displayName,
                            wallet: {
                                create: { balance: localBalance },
                            },
                        },
                    });
                } else if (!centralUser.wallet) {
                    // Create wallet
                    await walletDb.centralWallet.create({
                        data: {
                            userId: centralUser.id,
                            balance: localBalance,
                        },
                    });
                } else {
                    // Update balance and log transaction
                    const walletId = centralUser.wallet.id;
                    await walletDb.$transaction([
                        walletDb.centralWallet.update({
                            where: { id: walletId },
                            data: { balance: localBalance },
                        }),
                        walletDb.centralTransaction.create({
                            data: {
                                walletId,
                                amount: Math.abs(diff),
                                type: diff > 0 ? "CREDIT" : "DEBIT",
                                reason: "SYSTEM",
                                description: `Wallet sync migration (${GAME_MODE}): local=${localBalance}, central=${centralBalance}`,
                                game: GAME_MODE,
                                balanceBefore: centralBalance,
                                balanceAfter: localBalance,
                            },
                        }),
                    ]);
                }
            }

            results.push({
                email,
                displayName: lw.player?.displayName || "Unknown",
                localBalance,
                centralBalance,
                diff,
                action: dryRun ? "WOULD_SYNC" : "SYNCED",
            });
        }

        const needsSync = results.filter(r => r.diff !== 0);

        return NextResponse.json({
            success: true,
            dryRun,
            summary: {
                total: results.length,
                alreadySynced: results.filter(r => r.action === "ALREADY_SYNCED").length,
                needsSync: needsSync.length,
            },
            details: needsSync,
        });
    } catch (error) {
        console.error("Wallet sync error:", error);
        return NextResponse.json({ error: "Sync failed", details: String(error) }, { status: 500 });
    }
}
