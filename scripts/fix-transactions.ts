/**
 * Fix Transaction Migration: transform v1 enum values to v2 format
 * v1 uses lowercase (credit/debit), v2 uses uppercase (CREDIT/DEBIT)
 * Also skips the v1-only 'timestamp' column
 *
 * Usage: npx tsx scripts/fix-transactions.ts
 */

import "dotenv/config";
import pg from "pg";

const V1_CONFIG = {
    host: "aws-1-ap-south-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.jxoeyaonjosetunwvvym",
    password: "123Clashofclan@",
    max: 3,
};

async function main() {
    console.log("🔧 Fixing Transaction migration (enum values)...\n");

    const v1 = new pg.Pool(V1_CONFIG);
    const v2 = new pg.Pool({ connectionString: process.env.DATABASE_URL! });

    try {
        await v1.query("SELECT 1");
        await v2.query("SELECT 1");
        console.log("✅ Connected to both databases\n");

        // Get v1 columns
        const v1ColInfo = await v1.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Transaction' ORDER BY ordinal_position`
        );
        const v1Columns: string[] = v1ColInfo.rows.map((r: { column_name: string }) => r.column_name);

        // Get v2 columns
        const v2ColInfo = await v2.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Transaction' ORDER BY ordinal_position`
        );
        const v2Columns = new Set(v2ColInfo.rows.map((r: { column_name: string }) => r.column_name));

        // Build column mapping: v1 column -> v2 column
        // v1 has 'timestamp', v2 has 'createdAt'
        const columnMap: Record<string, string> = {};
        for (const col of v1Columns) {
            if (col === "timestamp" && v2Columns.has("createdAt")) {
                columnMap[col] = "createdAt";
            } else if (v2Columns.has(col)) {
                columnMap[col] = col;
            }
        }

        const v1SelectCols = Object.keys(columnMap).map((c) => `"${c}"`).join(", ");
        const v2InsertCols = Object.values(columnMap).map((c) => `"${c}"`).join(", ");

        console.log(`  V1 columns: ${Object.keys(columnMap).join(', ')}`);
        console.log(`  V2 columns: ${Object.values(columnMap).join(', ')}`);

        // Get existing IDs in v2
        const existing = await v2.query(`SELECT id FROM "Transaction"`);
        const existingIds = new Set(existing.rows.map((r: { id: string }) => r.id));
        console.log(`\nV2 has ${existingIds.size} transactions already`);

        // Fetch from v1
        const v1Data = await v1.query(`SELECT ${v1SelectCols} FROM "Transaction"`);
        console.log(`V1 has ${v1Data.rows.length} transactions total`);

        const newRows = v1Data.rows.filter((r: { id: string }) => !existingIds.has(r.id));
        console.log(`${newRows.length} new transactions to migrate\n`);

        let migrated = 0;
        let errors = 0;

        for (const row of newRows) {
            // Transform enum values: lowercase -> UPPERCASE
            if (row.type) row.type = (row.type as string).toUpperCase();

            const v1Keys = Object.keys(columnMap);
            const values = v1Keys.map((_: string, idx: number) => `$${idx + 1}`).join(", ");
            const rowValues = v1Keys.map((c: string) => row[c]);

            try {
                await v2.query(
                    `INSERT INTO "Transaction" (${v2InsertCols}) VALUES (${values}) ON CONFLICT DO NOTHING`,
                    rowValues
                );
                migrated++;
            } catch (err: unknown) {
                errors++;
                if (errors <= 5) {
                    console.error(`  ⚠️`, (err as { detail?: string }).detail || (err as Error).message);
                }
            }
        }

        console.log(`\n✅ Transaction migration complete!`);
        console.log(`   Migrated: ${migrated}`);
        console.log(`   Errors: ${errors}`);

        const total = await v2.query(`SELECT COUNT(*) as cnt FROM "Transaction"`);
        console.log(`   Total in V2: ${total.rows[0].cnt}`);

    } finally {
        await v1.end();
        await v2.end();
    }
}

main().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
});
