import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Reasonable timeouts for serverless (Vercel)
    transactionOptions: {
      maxWait: 5000,  // 5 seconds max wait for transaction slot
      timeout: 10000, // 10 seconds max transaction duration
    },
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn", "info"],
    errorFormat: "colorless",
  });

// Cache prisma instance in production too (reduces cold start overhead)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

