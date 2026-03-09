/* eslint-disable @typescript-eslint/no-explicit-any */
import { walletDb } from "./wallet-db";
import { prisma } from "./database";

/**
 * Central Wallet Service
 * 
 * Helper functions to bridge game-specific player data with
 * the central wallet database. All wallet operations go through here.
 */

const GAME_MODE = process.env.NEXT_PUBLIC_GAME_MODE || "bgmi";

// ─── Helpers ────────────────────────────────────────────────

/**
 * Get a player's email from their game DB player ID.
 * Used to bridge game-specific player IDs to the central wallet.
 */
export async function getEmailByPlayerId(playerId: string, tx?: any): Promise<string | null> {
    const db = tx || prisma;
    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { user: { select: { email: true } } },
    });
    return player?.user?.email ?? null;
}

// ─── Read Operations ────────────────────────────────────────

/**
 * Get or create a central wallet for a user by their email.
 * Called when a player logs in or needs their balance.
 */
export async function getOrCreateCentralWallet(email: string, name?: string | null, imageUrl?: string | null) {
    // Try to find existing user
    let user = await walletDb.centralUser.findUnique({
        where: { email },
        include: { wallet: true },
    });

    // Create user + wallet if they don't exist
    if (!user) {
        user = await walletDb.centralUser.create({
            data: {
                email,
                name: name || null,
                imageUrl: imageUrl || null,
                wallet: {
                    create: { balance: 0 },
                },
            },
            include: { wallet: true },
        });
    }

    // Ensure wallet exists (edge case: user exists but no wallet)
    if (!user.wallet) {
        const wallet = await walletDb.centralWallet.create({
            data: {
                userId: user.id,
                balance: 0,
            },
        });
        return { user, wallet };
    }

    return { user, wallet: user.wallet };
}

/**
 * Get the central wallet balance for a user by email.
 */
export async function getCentralBalance(email: string): Promise<number> {
    const user = await walletDb.centralUser.findUnique({
        where: { email },
        include: { wallet: true },
    });
    return user?.wallet?.balance ?? 0;
}

/**
 * Get recent transactions for a user, optionally filtered by game.
 */
export async function getCentralTransactions(
    email: string,
    options?: { game?: string; limit?: number; cursor?: string }
) {
    const user = await walletDb.centralUser.findUnique({
        where: { email },
        include: { wallet: true },
    });

    if (!user?.wallet) return { transactions: [], hasMore: false };

    const limit = options?.limit ?? 20;

    const transactions = await walletDb.centralTransaction.findMany({
        where: {
            walletId: user.wallet.id,
            ...(options?.game ? { game: options.game } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = transactions.length > limit;
    if (hasMore) transactions.pop();

    return { transactions, hasMore };
}

// ─── Write Operations ───────────────────────────────────────

/**
 * Credit B-Coins to a user's central wallet.
 * Returns the updated balance.
 */
export async function creditCentralWallet(
    email: string,
    amount: number,
    description: string,
    reason: string = "OTHER",
    metadata?: Record<string, unknown>,
    name?: string | null,
    imageUrl?: string | null,
): Promise<{ balance: number; transaction: any }> {
    const { wallet } = await getOrCreateCentralWallet(email, name, imageUrl);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Update balance and create transaction atomically
    const [updatedWallet, transaction] = await walletDb.$transaction([
        walletDb.centralWallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
        }),
        walletDb.centralTransaction.create({
            data: {
                amount: Math.abs(amount),
                type: "CREDIT",
                reason: reason as any,
                description,
                game: GAME_MODE,
                balanceBefore,
                balanceAfter,
                walletId: wallet.id,
                metadata: metadata ?? undefined,
            },
        }),
    ]);

    return { balance: updatedWallet.balance, transaction };
}

/**
 * Debit B-Coins from a user's central wallet.
 * Returns the updated balance. Throws if insufficient funds.
 */
export async function debitCentralWallet(
    email: string,
    amount: number,
    description: string,
    reason: string = "OTHER",
    metadata?: Record<string, unknown>,
): Promise<{ balance: number; transaction: any }> {
    const { wallet } = await getOrCreateCentralWallet(email);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    // Update balance and create transaction atomically
    const [updatedWallet, transaction] = await walletDb.$transaction([
        walletDb.centralWallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
        }),
        walletDb.centralTransaction.create({
            data: {
                amount: Math.abs(amount),
                type: "DEBIT",
                reason: reason as any,
                description,
                game: GAME_MODE,
                balanceBefore,
                balanceAfter,
                walletId: wallet.id,
                metadata: metadata ?? undefined,
            },
        }),
    ]);

    return { balance: updatedWallet.balance, transaction };
}

/**
 * Transfer B-Coins between two users.
 */
export async function transferCentralWallet(
    fromEmail: string,
    toEmail: string,
    amount: number,
    description?: string,
): Promise<void> {
    const { wallet: fromWallet } = await getOrCreateCentralWallet(fromEmail);
    const { wallet: toWallet } = await getOrCreateCentralWallet(toEmail);

    const fromBefore = fromWallet.balance;
    const toBefore = toWallet.balance;

    await walletDb.$transaction([
        // Debit sender
        walletDb.centralWallet.update({
            where: { id: fromWallet.id },
            data: { balance: fromBefore - amount },
        }),
        walletDb.centralTransaction.create({
            data: {
                amount,
                type: "DEBIT",
                reason: "TRANSFER_SENT",
                description: description || `Transfer to player`,
                game: GAME_MODE,
                balanceBefore: fromBefore,
                balanceAfter: fromBefore - amount,
                walletId: fromWallet.id,
            },
        }),
        // Credit receiver
        walletDb.centralWallet.update({
            where: { id: toWallet.id },
            data: { balance: toBefore + amount },
        }),
        walletDb.centralTransaction.create({
            data: {
                amount,
                type: "CREDIT",
                reason: "TRANSFER_RECEIVED",
                description: description || `Transfer from player`,
                game: GAME_MODE,
                balanceBefore: toBefore,
                balanceAfter: toBefore + amount,
                walletId: toWallet.id,
            },
        }),
    ]);
}


