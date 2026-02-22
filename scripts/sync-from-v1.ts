/**
 * Full Data Migration: V1 DB → V2 DB
 *
 * Connects to both databases and copies all tables in dependency order.
 * Uses upserts (insert ... ON CONFLICT DO NOTHING) for idempotency.
 * Safe to run multiple times.
 *
 * Usage: npx tsx scripts/sync-from-v1.ts
 */

import "dotenv/config";
import pg from "pg";

// V1 connection (password has @ char, so use config object)
const V1_CONFIG = {
    host: "aws-1-ap-south-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.jxoeyaonjosetunwvvym",
    password: "123Clashofclan@",
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    max: 3,
};
const V2_URL = process.env.DATABASE_URL!;

// Tables in dependency order (parents first, children after)
const TABLES = [
    // 1. No dependencies
    "AppSetting",
    "Rule",
    "JobCategory",
    "Gallery",
    "DailyMetrics",
    "SoloTaxPool",

    // 2. Depends on Gallery
    "User",

    // 3. Depends on User
    "Player",
    "Notification",

    // 4. Depends on Player
    "Wallet",
    "PlayerBan",
    "PlayerStreak",
    "PushSubscription",
    "PlayerJobListing",
    "GameScore",

    // 5. Depends on User + Player
    "Referral",

    // 6. Depends on Player (self-ref)
    "PlayerMeritRating",

    // 7. No FK or depends on Gallery
    "Season",

    // 8. Depends on Season + Player
    "RoyalPass",

    // 9. Depends on Season
    "Tournament",

    // 10. Depends on Tournament
    "TournamentSequence",
    "Match",
    "Poll",

    // 11. Depends on Tournament/Season
    "Team",

    // 12. Depends on Poll
    "PollOption",

    // 13. Depends on Poll + Player
    "PlayerPollVote",

    // 14. Depends on Team + Tournament
    "TournamentWinner",

    // 15. Depends on Match + Team + Tournament
    "TeamStats",

    // 16. Depends on TeamStats + Team + Player + Match
    "TeamPlayerStats",

    // 17. Depends on Player + Team + Match
    "PlayerStats",

    // 18. Depends on Player + Match + Tournament + Team
    "MatchPlayerPlayed",

    // 19. Depends on Player
    "Transaction",
    "PendingReward",

    // 20. Depends on Player (from/to)
    "UCTransfer",

    // 21. Depends on Tournament
    "Income",
    "RecentMatchGroup",

    // 22. Depends on RecentMatchGroup
    "RecentMatchImage",

    // 23. Depends on Player
    "Payment",

    // 24. Depends on JobCategory
    "Job",

    // 25. Depends on PlayerJobListing + Player
    "JobListingReaction",
];

// ── Migration ────────────────────────────────────────────────
async function main() {
    console.log("🚀 Starting V1 → V2 data migration...\n");

    const v1 = new pg.Pool(V1_CONFIG);
    const v2 = new pg.Pool({ connectionString: V2_URL });

    try {
        // Test connections
        await v1.query("SELECT 1");
        console.log("✅ Connected to V1 database");
        await v2.query("SELECT 1");
        console.log("✅ Connected to V2 database\n");

        let totalMigrated = 0;
        let totalSkipped = 0;

        for (const table of TABLES) {
            try {
                // Check if table exists in v1
                const tableCheck = await v1.query(
                    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
                    [table]
                );

                if (!tableCheck.rows[0].exists) {
                    // Try quoted name
                    const quotedCheck = await v1.query(
                        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
                        [`"${table}"`]
                    );
                    if (!quotedCheck.rows[0].exists) {
                        console.log(`⏭️  ${table} — table not found in V1, skipping`);
                        continue;
                    }
                }

                // Get row count from v1
                const v1Count = await v1.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
                const sourceCount = parseInt(v1Count.rows[0].cnt);

                if (sourceCount === 0) {
                    console.log(`⏭️  ${table} — 0 rows in V1, skipping`);
                    continue;
                }

                // Get existing count in v2
                const v2Count = await v2.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
                const destCount = parseInt(v2Count.rows[0].cnt);

                if (destCount >= sourceCount) {
                    console.log(`✅ ${table} — already synced (${destCount} rows)`);
                    totalSkipped += destCount;
                    continue;
                }

                // Get columns from BOTH databases and use intersection
                const v1ColInfo = await v1.query(
                    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
                    [table]
                );
                const v1Columns = new Set(v1ColInfo.rows.map((r: { column_name: string }) => r.column_name));

                const v2ColInfo = await v2.query(
                    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
                    [table]
                );
                const v2Columns = new Set(v2ColInfo.rows.map((r: { column_name: string }) => r.column_name));

                // Only use columns that exist in BOTH databases
                const columns = [...v1Columns].filter((c) => v2Columns.has(c));

                if (columns.length === 0) {
                    console.log(`⚠️  ${table} — no common columns found, skipping`);
                    continue;
                }

                const skippedCols = [...v1Columns].filter((c) => !v2Columns.has(c));
                if (skippedCols.length > 0) {
                    console.log(`  ℹ️  ${table}: skipping v1-only columns: ${skippedCols.join(', ')}`);
                }

                // Fetch all rows from v1
                const colList = columns.map((c: string) => `"${c}"`).join(", ");
                const v1Data = await v1.query(`SELECT ${colList} FROM "${table}" ORDER BY "createdAt" ASC`).catch(async () => {
                    // If createdAt doesn't exist, fetch without ordering
                    return await v1.query(`SELECT ${colList} FROM "${table}"`);
                });

                if (v1Data.rows.length === 0) {
                    console.log(`⏭️  ${table} — no data to migrate`);
                    continue;
                }

                // Batch insert into v2 with ON CONFLICT DO NOTHING
                const BATCH_SIZE = 100;
                let inserted = 0;
                let fkErrors = 0;
                let otherErrors = 0;

                for (let i = 0; i < v1Data.rows.length; i += BATCH_SIZE) {
                    const batch = v1Data.rows.slice(i, i + BATCH_SIZE);

                    for (const row of batch) {
                        const values = columns.map((_: string, idx: number) => `$${idx + 1}`).join(", ");
                        const rowValues = columns.map((c: string) => row[c]);

                        try {
                            await v2.query(
                                `INSERT INTO "${table}" (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING`,
                                rowValues
                            );
                            inserted++;
                        } catch (err: unknown) {
                            const pgErr = err as { code?: string; detail?: string };
                            if (pgErr.code === "23503") { fkErrors++; continue; }
                            if (pgErr.code === "23505") continue;
                            otherErrors++;
                            if (otherErrors <= 3) console.error(`    ⚠️  ${table}:`, pgErr.detail || (err as Error).message);
                        }
                    }

                    // Progress for large tables
                    if (v1Data.rows.length > 500 && i % 500 === 0 && i > 0) {
                        process.stdout.write(`  ... ${i}/${v1Data.rows.length}\r`);
                    }
                }

                const newTotal = parseInt((await v2.query(`SELECT COUNT(*) as cnt FROM "${table}"`)).rows[0].cnt);
                const migrated = newTotal - destCount;
                const suffix = fkErrors > 0 ? ` (${fkErrors} FK skipped)` : '';
                console.log(`📦 ${table} — migrated ${migrated} new rows (${newTotal} total)${suffix}`);
                totalMigrated += migrated;

            } catch (err) {
                console.error(`❌ ${table} — error:`, (err as Error).message);
            }
        }

        // Fix autoincrement sequences
        console.log("\n🔧 Fixing sequences...");
        const sequences = await v2.query(
            `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`
        );
        for (const seq of sequences.rows) {
            try {
                // Extract table and column from sequence name
                const seqName = seq.sequence_name;
                // Typical format: TableName_columnName_seq
                const tableName = seqName.replace(/_[^_]+_seq$/, '');
                const colName = seqName.replace(/^[^_]+_/, '').replace(/_seq$/, '');

                await v2.query(
                    `SELECT setval('"${seqName}"', COALESCE((SELECT MAX("${colName}") FROM "${tableName}"), 1), true)`
                ).catch(() => { /* ignore if table/col doesn't match */ });
            } catch { /* ignore */ }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   Migrated: ${totalMigrated} rows`);
        console.log(`   Skipped (already synced): ${totalSkipped} rows`);

    } finally {
        await v1.end();
        await v2.end();
    }
}

main().catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
});
