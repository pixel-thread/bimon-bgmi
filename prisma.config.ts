import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from the root .env (adjust path if needed)
dotenv.config({ path: path.resolve(__dirname, "./.env") });

export default defineConfig({
  schema: "src/lib/db/prisma/schema.prisma",
});
