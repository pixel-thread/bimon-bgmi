/* eslint-disable @typescript-eslint/no-explicit-any */
import { walletDb } from "./wallet-db";
import { prisma } from "./database";

/**
 * Central Wallet Service
 * 
 * All wallet operations go through here. Games with `usesCentralWallet: true`
 * (BGMI, PES) use the shared Neon database. Games with `usesCentralWallet: false`
 * (Free Fire) fall back to local game DB operations transparently.
 * 
 * This means API routes don't need to know which mode they're in —
 * the service handles the routing internally.
 */

const GAME_MODE = process.env.NEXT_PUBLIC_GAME_MODE || "bgmi";

/** Check if the current game uses the central wallet */
function isCentralWalletEnabled(): boolean {
    // Match against game-config.ts feature flags
    // Only bgmi and pes use central wallet; freefire is isolated
    return GAME_MODE !== "freefire";
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Get a player's email from their game DB player ID.
 */
export async function getEmailByPlayerId(playerId: string, tx?: any): Promise<string | null> {
    const db = tx || prisma;
    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { user: { select: { email: true } } },
    });
    return player?.user?.email ?? null;
}

/**
 * Find a player's local wallet by email.
 */
async function getLocalPlayerByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: { player: { include: { wallet: true } } },
    });
}

// ─── Read Operations ────────────────────────────────────────

/**
 * Get or create a central wallet for a user by their email.
 */
export async function getOrCreateCentralWallet(email: string, name?: string | null, imageUrl?: string | null) {
    if (!isCentralWalletEnabled()) {
        // Return a dummy structure for isolated games
        const user = await getLocalPlayerByEmail(email);
        return {
            user: { id: user?.id ?? "", email },
            wallet: { id: "", balance: user?.player?.wallet?.balance ?? 0 },
        };
    }

    let user = await walletDb.centralUser.findUnique({
        where: { email },
        include: { wallet: true },
    });

    if (!user) {
        // Seed initial balance from local game DB (one-time migration)
        const localUser = await getLocalPlayerByEmail(email);
        const localBalance = localUser?.player?.wallet?.balance ?? 0;

        user = await walletDb.centralUser.create({
            data: {
                email,
                name: name || null,
                imageUrl: imageUrl || null,
                wallet: { create: { balance: localBalance } },
            },
            include: { wallet: true },
        });
    }

    if (!user.wallet) {
        const localUser = await getLocalPlayerByEmail(email);
        const localBalance = localUser?.player?.wallet?.balance ?? 0;
        const wallet = await walletDb.centralWallet.create({
            data: { userId: user.id, balance: localBalance },
        });
        return { user, wallet };
    }

    return { user, wallet: user.wallet };
}

/**
 * Get wallet balance for a user by email.
 * Returns central balance for unified games, local balance for isolated games.
 * Fast read-only — does NOT auto-create wallets.
 */
export async function getCentralBalance(email: string): Promise<number> {
    if (!isCentralWalletEnabled()) {
        const user = await getLocalPlayerByEmail(email);
        return user?.player?.wallet?.balance ?? 0;
    }

    const user = await walletDb.centralUser.findUnique({
        where: { email },
        select: { wallet: { select: { balance: true } } },
    });
    return user?.wallet?.balance ?? 0;
}

/**
 * Batch-fetch central wallet balances for multiple emails.
 * Much faster than calling getCentralBalance per player.
 */
export async function getCentralBalancesBatch(emails: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (emails.length === 0) return map;

    if (!isCentralWalletEnabled()) {
        // For isolated games, batch-read from local DB
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            include: { player: { include: { wallet: true } } },
        });
        for (const u of users) {
            if (u.email) map.set(u.email, u.player?.wallet?.balance ?? 0);
        }
        return map;
    }

    const centralUsers = await walletDb.centralUser.findMany({
        where: { email: { in: emails } },
        select: { email: true, wallet: { select: { balance: true } } },
    });
    for (const u of centralUsers) {
        map.set(u.email, u.wallet?.balance ?? 0);
    }
    return map;
}

/**
 * Get recent transactions for a user, optionally filtered by game.
 */
export async function getCentralTransactions(
    email: string,
    options?: { game?: string; limit?: number; cursor?: string }
) {
    if (!isCentralWalletEnabled()) {
        return { transactions: [], hasMore: false };
    }

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
 * Credit B-Coins to a user's wallet.
 * Central wallet for unified games, local DB for isolated games.
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
    if (!isCentralWalletEnabled()) {
        // Isolated game — credit local DB only
        const user = await getLocalPlayerByEmail(email);
        if (!user?.player) throw new Error("Player not found");
        const currentBalance = user.player.wallet?.balance ?? 0;
        const newBalance = currentBalance + amount;
        await prisma.wallet.upsert({
            where: { playerId: user.player.id },
            create: { playerId: user.player.id, balance: newBalance },
            update: { balance: newBalance },
        });
        return { balance: newBalance, transaction: null };
    }

    const { wallet } = await getOrCreateCentralWallet(email, name, imageUrl);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

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
 * Debit B-Coins from a user's wallet.
 * Central wallet for unified games, local DB for isolated games.
 */
export async function debitCentralWallet(
    email: string,
    amount: number,
    description: string,
    reason: string = "OTHER",
    metadata?: Record<string, unknown>,
): Promise<{ balance: number; transaction: any }> {
    if (!isCentralWalletEnabled()) {
        // Isolated game — debit local DB only
        const user = await getLocalPlayerByEmail(email);
        if (!user?.player) throw new Error("Player not found");
        const currentBalance = user.player.wallet?.balance ?? 0;
        const newBalance = currentBalance - amount;
        await prisma.wallet.upsert({
            where: { playerId: user.player.id },
            create: { playerId: user.player.id, balance: newBalance },
            update: { balance: newBalance },
        });
        return { balance: newBalance, transaction: null };
    }

    const { wallet } = await getOrCreateCentralWallet(email);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

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
 * Central wallet for unified games, local DB for isolated games.
 */
export async function transferCentralWallet(
    fromEmail: string,
    toEmail: string,
    amount: number,
    description?: string,
): Promise<void> {
    if (!isCentralWalletEnabled()) {
        // Isolated game — transfer locally
        const [fromUser, toUser] = await Promise.all([
            getLocalPlayerByEmail(fromEmail),
            getLocalPlayerByEmail(toEmail),
        ]);
        if (!fromUser?.player || !toUser?.player) throw new Error("Player not found");
        const fromBalance = fromUser.player.wallet?.balance ?? 0;
        const toBalance = toUser.player.wallet?.balance ?? 0;
        await prisma.$transaction([
            prisma.wallet.upsert({
                where: { playerId: fromUser.player.id },
                create: { playerId: fromUser.player.id, balance: fromBalance - amount },
                update: { balance: fromBalance - amount },
            }),
            prisma.wallet.upsert({
                where: { playerId: toUser.player.id },
                create: { playerId: toUser.player.id, balance: toBalance + amount },
                update: { balance: toBalance + amount },
            }),
        ]);
        return;
    }

    const { wallet: fromWallet } = await getOrCreateCentralWallet(fromEmail);
    const { wallet: toWallet } = await getOrCreateCentralWallet(toEmail);

    const fromBefore = fromWallet.balance;
    const toBefore = toWallet.balance;

    await walletDb.$transaction([
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
