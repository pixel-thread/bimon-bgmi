/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Central Wallet Database Client
 * 
 * This connects to the shared Neon database that holds B-Coin wallets
 * and transactions across all games (BGMI, PES, Free Fire, etc.).
 * 
 * Usage:
 *   import { walletDb } from "@/lib/wallet-db";
 *   const wallet = await walletDb.centralWallet.findUnique({ ... });
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const WalletPrisma = require(".prisma/wallet-client");

const globalForWallet = globalThis as unknown as {
    walletPrisma: any | undefined;
};

function createWalletClient() {
    return new WalletPrisma.PrismaClient({
        datasourceUrl: process.env.WALLET_DATABASE_URL,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

export const walletDb =
    globalForWallet.walletPrisma ?? createWalletClient();

if (process.env.NODE_ENV !== "production") {
    globalForWallet.walletPrisma = walletDb;
}
