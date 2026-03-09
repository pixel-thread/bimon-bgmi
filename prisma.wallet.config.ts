import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/wallet-schema.prisma",
    migrations: {
        path: "prisma/wallet-migrations",
    },
    datasource: {
        url: env("WALLET_DATABASE_URL"),
    },
});
