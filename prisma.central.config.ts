import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/central-schema.prisma",
    datasource: {
        url: process.env.CENTRAL_DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    },
});
