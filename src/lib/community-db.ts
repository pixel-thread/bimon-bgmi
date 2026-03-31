/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Community Database Client
 * 
 * Connects to the shared Neon database for cross-game community features
 * (messages, polls, votes). Lazy-initialized — only connects when first used.
 * 
 * Usage:
 *   import { communityDb } from "@/lib/community-db";
 *   const msgs = await communityDb.centralCommunityMessage.findMany({ ... });
 */

import { PrismaPg } from "@prisma/adapter-pg";

const globalForCommunity = globalThis as unknown as {
    communityPrisma: any | undefined;
};

function createCommunityClient() {
    if (!process.env.CENTRAL_DATABASE_URL) {
        console.warn("[community-db] CENTRAL_DATABASE_URL not set — community features unavailable.");
        return null;
    }

    try {
        const CommunityPrisma = require(".prisma/central-client");
        const adapter = new PrismaPg({ connectionString: process.env.CENTRAL_DATABASE_URL });

        return new CommunityPrisma.PrismaClient({
            adapter,
            log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        });
    } catch (e) {
        console.error("[community-db] Failed to load community client:", e);
        return null;
    }
}

/** Lazy-initialized community DB client — only created on first access */
export const communityDb = new Proxy({} as any, {
    get(_target, prop) {
        if (!globalForCommunity.communityPrisma) {
            globalForCommunity.communityPrisma = createCommunityClient();
        }
        return globalForCommunity.communityPrisma?.[prop];
    },
});


