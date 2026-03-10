import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/wallet-schema.prisma",
    migrations: {
        path: "prisma/wallet-migrations",
    },
    datasource: {
        // Fallback to dummy URL at generate time (actual URL is provided
        // at runtime via PrismaPg adapter in wallet-db.ts)
        url: process.env.WALLET_DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    },
});
