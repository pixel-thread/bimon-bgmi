import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env variables from your root .env file (adjust path to your .env if needed)
dotenv.config({ path: path.resolve(__dirname, "./.env") });

export default defineConfig({
  schema: path.resolve(__dirname, "src/lib/db/prisma/schema.prisma"),
  migrations: {
    seed: "tsx seeds/user.ts",
  },
});
