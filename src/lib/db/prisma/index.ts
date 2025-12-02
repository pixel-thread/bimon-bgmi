import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // BUG: Should remove when deploy on vps
    transactionOptions: {
      maxWait: 600000, // 10 minutes
      timeout: 600000, // 10 minutes
    },
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn", "info"],
    errorFormat: "colorless",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
