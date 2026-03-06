import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Multi-tenant database support.
 *
 * Single deployment mode:
 *   - Uses DATABASE_URL_BGMI, DATABASE_URL_FREEFIRE, DATABASE_URL_PES
 *   - getPrisma(gameMode) returns the correct client
 *
 * Legacy / local dev mode:
 *   - Falls back to DATABASE_URL if game-specific URLs not set
 *   - Works exactly as before
 */

const globalForPrisma = globalThis as unknown as {
    prismaClients: Record<string, PrismaClient>;
};

// Database URL mapping per game mode
function getDatabaseUrl(gameMode?: string): string {
    const urlMap: Record<string, string | undefined> = {
        bgmi: process.env.DATABASE_URL_BGMI,
        freefire: process.env.DATABASE_URL_FREEFIRE,
        pes: process.env.DATABASE_URL_PES,
    };

    // Try game-specific URL first, fall back to generic DATABASE_URL
    if (gameMode && urlMap[gameMode]) {
        return urlMap[gameMode]!;
    }
    return process.env.DATABASE_URL!;
}

function createPrismaClient(databaseUrl: string) {
    const pool = new pg.Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 10_000, // 10s — prevent cold-start hangs
        idleTimeoutMillis: 30_000, // 30s — release idle connections
        max: 5, // limit pool size for serverless
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

// Cache clients per game mode to avoid creating new connections
if (!globalForPrisma.prismaClients) {
    globalForPrisma.prismaClients = {};
}

/**
 * Get Prisma client for a specific game mode.
 * Used in API routes: const db = getPrisma("pes");
 */
export function getPrisma(gameMode?: string): PrismaClient {
    const key = gameMode || "default";
    if (!globalForPrisma.prismaClients[key]) {
        globalForPrisma.prismaClients[key] = createPrismaClient(getDatabaseUrl(gameMode));
    }
    return globalForPrisma.prismaClients[key];
}

/**
 * Default prisma client — uses DATABASE_URL or NEXT_PUBLIC_GAME_MODE.
 * This keeps all existing `import { prisma }` usage working without changes.
 */
export const prisma = getPrisma(process.env.NEXT_PUBLIC_GAME_MODE || "bgmi");
