import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL!,
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

