/**
 * Sync missing data from v1 database to v2 database.
 * Syncs: _PlayerToTeam join table + Transaction records.
 *
 * Usage: npx tsx scripts/sync-from-v1.ts
 */

import pg from "pg";
import { config } from "dotenv";

config();

const V1_URL =
    "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan%40@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const V2_URL = process.env.DATABASE_URL!;

async function main() {
    console.log("🔗 Connecting to V1 (source)...");
    const v1 = new pg.Client({ connectionString: V1_URL });
    await v1.connect();

    console.log("🔗 Connecting to V2 (destination)...");
    const v2 = new pg.Client({ connectionString: V2_URL });
    await v2.connect();

    // ─── 1. Sync _PlayerToTeam join table ───────────────────────
    console.log("\n📋 Syncing _PlayerToTeam...");
    const v1PT = await v1.query(`SELECT "A", "B" FROM "_PlayerToTeam"`);
    const v2PT = await v2.query(`SELECT "A", "B" FROM "_PlayerToTeam"`);
    const v2PTSet = new Set(v2PT.rows.map((r) => `${r.A}|${r.B}`));
    const missingPT = v1PT.rows.filter((r) => !v2PTSet.has(`${r.A}|${r.B}`));
    console.log(`   V1: ${v1PT.rows.length}, V2: ${v2PT.rows.length}, Missing: ${missingPT.length}`);

    if (missingPT.length > 0) {
        // Validate FK references exist in V2
        const ptPlayerIds = [...new Set(missingPT.map((r) => r.A))];
        const ptTeamIds = [...new Set(missingPT.map((r) => r.B))];
        const v2PTPlayers = await v2.query(`SELECT id FROM "Player" WHERE id = ANY($1)`, [ptPlayerIds]);
        const v2PTTeams = await v2.query(`SELECT id FROM "Team" WHERE id = ANY($1)`, [ptTeamIds]);
        const v2PSet = new Set(v2PTPlayers.rows.map((r) => r.id));
        const v2TSet = new Set(v2PTTeams.rows.map((r) => r.id));
        const validPT = missingPT.filter((r) => v2PSet.has(r.A) && v2TSet.has(r.B));
        const skippedPT = missingPT.length - validPT.length;
        if (skippedPT > 0) console.log(`   ⚠️  Skipping ${skippedPT} (FK missing in V2)`);

        if (validPT.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < validPT.length; i += batchSize) {
                const batch = validPT.slice(i, i + batchSize);
                const values = batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(", ");
                const params = batch.flatMap((r) => [r.A, r.B]);
                await v2.query(`INSERT INTO "_PlayerToTeam" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`, params);
            }
            console.log(`   ✅ Inserted ${validPT.length} player-team associations`);
        }
    } else {
        console.log("   ✅ Already in sync!");
    }

    // ─── 2. Sync Transaction records ────────────────────────────
    console.log("\n📋 Syncing Transaction records...");

    // V1 transactions have: id, amount, type (string: "credit"/"debit"), description, timestamp, playerId
    // V2 transactions have: id, amount, type (enum: CREDIT/DEBIT), description, createdAt, playerId
    const v1Txns = await v1.query(`SELECT id, amount, type, description, timestamp, "playerId" FROM "Transaction"`);
    const v2TxnIds = await v2.query(`SELECT id FROM "Transaction"`);
    const v2TxnIdSet = new Set(v2TxnIds.rows.map((r) => r.id));

    const missingTxns = v1Txns.rows.filter((r) => !v2TxnIdSet.has(r.id));
    console.log(`   V1: ${v1Txns.rows.length}, V2: ${v2TxnIds.rows.length}, Missing: ${missingTxns.length}`);

    // Verify referenced players exist in V2
    const missingPlayerIds = [...new Set(missingTxns.map((r) => r.playerId))];
    const v2Players = await v2.query(`SELECT id FROM "Player" WHERE id = ANY($1)`, [missingPlayerIds]);
    const v2PlayerIdSet = new Set(v2Players.rows.map((r) => r.id));

    const validTxns = missingTxns.filter((r) => v2PlayerIdSet.has(r.playerId));
    const skipped = missingTxns.length - validTxns.length;
    if (skipped > 0) {
        console.log(`   ⚠️  Skipping ${skipped} transactions (Player doesn't exist in V2)`);
    }

    if (validTxns.length > 0) {
        console.log(`   ✏️  Inserting ${validTxns.length} transactions...`);

        // Convert v1 type (lowercase string) to v2 type (uppercase enum)
        const batchSize = 50;
        for (let i = 0; i < validTxns.length; i += batchSize) {
            const batch = validTxns.slice(i, i + batchSize);
            const values = batch
                .map((_, idx) => {
                    const base = idx * 6;
                    return `($${base + 1}, $${base + 2}, $${base + 3}::"TransactionType", $${base + 4}, $${base + 5}, $${base + 6})`;
                })
                .join(", ");
            const params = batch.flatMap((r) => [
                r.id,
                r.amount,
                r.type === "credit" ? "CREDIT" : r.type === "debit" ? "DEBIT" : r.type.toUpperCase(),
                r.description,
                r.timestamp,
                r.playerId,
            ]);

            await v2.query(
                `INSERT INTO "Transaction" (id, amount, type, description, "createdAt", "playerId") VALUES ${values} ON CONFLICT (id) DO NOTHING`,
                params
            );
        }
        console.log(`   ✅ Inserted ${validTxns.length} transactions`);
    } else {
        console.log("   ✅ Transactions already in sync!");
    }

    // ─── Summary ────────────────────────────────────────────────
    const v2TxnAfter = await v2.query(`SELECT COUNT(*) FROM "Transaction"`);
    console.log(`\n📊 After sync: V2 has ${v2TxnAfter.rows[0].count} transactions`);

    await v1.end();
    await v2.end();
    console.log("\n✅ Done!");
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
