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
        mlbb: process.env.DATABASE_URL_MLBB,
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
    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    // Sanitize Player.displayName on every read — macron vowels (ĀāĒēĪīŌōŪū)
    // are invisible characters in BGMI and should be replaced with spaces.
    // Uses $extends so it works for ALL queries, including nested includes.
    return client.$extends({
        result: {
            player: {
                displayName: {
                    needs: { displayName: true },
                    compute(player) {
                        if (!player.displayName) return null;
                        return player.displayName
                            .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                    },
                },
            },
        },
    }) as unknown as PrismaClient;
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
 * Get the correct Prisma client for the current request.
 * Reads the game mode from the `x-game-mode` request header (set by proxy.ts)
 * or falls back to `game-mode` cookie, then env var.
 *
 * Use this in API routes and server-side code to ensure multi-game support:
 *   const db = await getRequestPrisma();
 */
export async function getRequestPrisma(): Promise<PrismaClient> {
    try {
        const { headers } = await import("next/headers");
        const headerStore = await headers();

        // 1. Try x-game-mode request header (set by proxy)
        const headerMode = headerStore.get("x-game-mode");
        if (headerMode && headerMode in getDatabaseUrlMap()) {
            return getPrisma(headerMode);
        }

        // 2. Try game-mode cookie (also set by proxy)
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const cookieMode = cookieStore.get("game-mode")?.value;
        if (cookieMode && cookieMode in getDatabaseUrlMap()) {
            return getPrisma(cookieMode);
        }
    } catch {
        // Not in request context (scripts, cron jobs, etc.) — use default
    }

    return getPrisma(process.env.NEXT_PUBLIC_GAME_MODE || "bgmi");
}

/** Map of valid game modes for validation */
function getDatabaseUrlMap(): Record<string, boolean> {
    return { bgmi: true, freefire: true, pes: true, mlbb: true };
}

/**
 * Default prisma client — uses DATABASE_URL or NEXT_PUBLIC_GAME_MODE.
 * This keeps all existing `import { prisma }` usage working without changes.
 *
 * ⚠️  For multi-game deployments, prefer `getRequestPrisma()` in API routes
 *     to ensure the correct database is used per domain.
 */
export const prisma = getPrisma(process.env.NEXT_PUBLIC_GAME_MODE || "bgmi");
