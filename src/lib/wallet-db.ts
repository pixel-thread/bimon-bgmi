/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Central Wallet Database Client
 * 
 * This connects to the shared Neon database that holds B-Coin wallets
 * and transactions across all games.
 * 
 * The client is lazy-initialized — it only connects when first used.
 * Games that don't use the central wallet (Free Fire) never trigger
 * a connection, so they don't need WALLET_DATABASE_URL.
 * 
 * Usage:
 *   import { walletDb } from "@/lib/wallet-db";
 *   const wallet = await walletDb.centralWallet.findUnique({ ... });
 */

const globalForWallet = globalThis as unknown as {
    walletPrisma: any | undefined;
};

function createWalletClient() {
    if (!process.env.WALLET_DATABASE_URL) {
        console.warn("[wallet-db] WALLET_DATABASE_URL not set — wallet operations will use local DB fallback.");
        return null;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const WalletPrisma = require(".prisma/wallet-client");

        return new WalletPrisma.PrismaClient({
            datasourceUrl: process.env.WALLET_DATABASE_URL,
            log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        });
    } catch (e) {
        console.error("[wallet-db] Failed to load wallet client — run: prisma generate --config=prisma.wallet.config.ts", e);
        return null;
    }
}

/** Lazy-initialized wallet client — only created on first access */
export const walletDb = new Proxy({} as any, {
    get(_target, prop) {
        if (!globalForWallet.walletPrisma) {
            globalForWallet.walletPrisma = createWalletClient();
        }
        return globalForWallet.walletPrisma[prop];
    },
});
