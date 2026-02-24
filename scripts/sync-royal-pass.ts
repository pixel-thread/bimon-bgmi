/**
 * Royal Pass Sync: V1 → V2
 *
 * Compares RoyalPass records between V1 and V2, identifies missing rows,
 * and syncs them over. Also reports any discrepancies in pricePaid.
 *
 * Usage: npx tsx scripts/sync-royal-pass.ts
 *        npx tsx scripts/sync-royal-pass.ts --dry-run   (just compare, don't write)
 */

import "dotenv/config";
import pg from "pg";

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

const isDryRun = process.argv.includes("--dry-run");

async function main() {
    console.log(`🚀 Royal Pass Sync${isDryRun ? " (DRY RUN)" : ""}...\n`);

    const v1 = new pg.Pool(V1_CONFIG);
    const v2 = new pg.Pool({ connectionString: V2_URL });

    try {
        await v1.query("SELECT 1");
        console.log("✅ Connected to V1");
        await v2.query("SELECT 1");
        console.log("✅ Connected to V2\n");

        // 1. Fetch all RoyalPass from both
        // Get V1 columns first to handle any schema differences
        const v1ColInfo = await v1.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'RoyalPass' ORDER BY ordinal_position`
        );
        console.log("V1 RoyalPass columns:", v1ColInfo.rows.map((r: Record<string, unknown>) => r.column_name).join(", "));

        const v1Passes = await v1.query(`
            SELECT rp.*
            FROM "RoyalPass" rp
            ORDER BY rp."createdAt" ASC
        `);
        const v2Passes = await v2.query(`
            SELECT rp.*
            FROM "RoyalPass" rp
            ORDER BY rp."createdAt" ASC
        `);

        // Get player names separately — handle column name differences
        const v1PlayerIds = [...new Set(v1Passes.rows.map((r: Record<string, unknown>) => r.playerId))];

        // Check what columns exist in V1 Player table
        const v1PlayerCols = await v1.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Player'`,
        );
        const allPlayerCols = v1PlayerCols.rows.map((r: Record<string, unknown>) => r.column_name as string);
        console.log("V1 Player columns:", allPlayerCols.join(", "));

        // Find best name column
        const nameColRaw = allPlayerCols.find(c => c === 'displayName')
            || allPlayerCols.find(c => c === 'display_name')
            || allPlayerCols.find(c => c === 'name')
            || 'id';
        const nameCol = /[A-Z]/.test(nameColRaw) ? `"${nameColRaw}"` : nameColRaw;

        const v1Players = await v1.query(
            `SELECT id, ${nameCol} AS name FROM "Player" WHERE id = ANY($1)`, [v1PlayerIds]
        );
        const playerNameMap = new Map<string, string>();
        for (const p of v1Players.rows) {
            playerNameMap.set(p.id, p.name || p.id);
        }

        console.log(`📊 V1: ${v1Passes.rows.length} Royal Pass records`);
        console.log(`📊 V2: ${v2Passes.rows.length} Royal Pass records\n`);

        // 2. Build lookup maps
        const v2Ids = new Set(v2Passes.rows.map((r: Record<string, unknown>) => r.id));
        const v2ByPlayer = new Map<string, Record<string, unknown>[]>();
        for (const row of v2Passes.rows) {
            const arr = v2ByPlayer.get(row.playerId as string) || [];
            arr.push(row);
            v2ByPlayer.set(row.playerId as string, arr);
        }

        // 3. Find missing records
        const missing: Record<string, unknown>[] = [];
        const mismatched: { v1: Record<string, unknown>; v2: Record<string, unknown> }[] = [];

        for (const v1Row of v1Passes.rows) {
            if (!v2Ids.has(v1Row.id)) {
                missing.push(v1Row);
            } else {
                // Check for pricePaid mismatch
                const v2Match = v2Passes.rows.find((r: Record<string, unknown>) => r.id === v1Row.id);
                if (v2Match && v2Match.pricePaid !== v1Row.pricePaid) {
                    mismatched.push({ v1: v1Row, v2: v2Match });
                }
            }
        }

        // 4. Report
        if (missing.length > 0) {
            console.log(`❌ Missing in V2: ${missing.length} records`);
            for (const row of missing) {
                console.log(`   • ${playerNameMap.get(row.playerId as string) || row.playerId} — ₹${row.pricePaid} paid, ${row.amount} UC (${row.displayValue} display)`);
            }
            console.log();
        } else {
            console.log("✅ No missing records\n");
        }

        if (mismatched.length > 0) {
            console.log(`⚠️  Price mismatches: ${mismatched.length}`);
            for (const { v1: v1r, v2: v2r } of mismatched) {
                console.log(`   • ${playerNameMap.get(v1r.playerId as string) || v1r.playerId}: V1=₹${v1r.pricePaid} vs V2=₹${v2r.pricePaid}`);
            }
            console.log();
        } else {
            console.log("✅ No price mismatches\n");
        }

        // Check hasRoyalPass flag in V2 (V1 doesn't have this column)
        const v2RPPlayers = await v2.query(`SELECT id, "displayName", "hasRoyalPass" FROM "Player" WHERE "hasRoyalPass" = true`);
        // Count unique players with RoyalPass records in V1
        const v1UniqueRPPlayers = new Set(v1Passes.rows.map((r: Record<string, unknown>) => r.playerId));
        console.log(`🏅 V1 unique RP holders (from records): ${v1UniqueRPPlayers.size}`);
        console.log(`🏅 V2 hasRoyalPass=true: ${v2RPPlayers.rows.length} players`);

        // Find V1 RP holders who don't have the flag in V2
        const v2RPIds = new Set(v2RPPlayers.rows.map((r: Record<string, unknown>) => r.id));
        const missingRP = [...v1UniqueRPPlayers].filter(pid => !v2RPIds.has(pid)).map(pid => ({
            id: pid,
            name: playerNameMap.get(pid as string) || pid,
        }));
        if (missingRP.length > 0) {
            console.log(`   ❌ ${missingRP.length} RP holders from V1 missing hasRoyalPass=true in V2:`);
            for (const r of missingRP) {
                console.log(`      • ${r.name}`);
            }
        }
        console.log();

        // 5. Sync if not dry run
        if (!isDryRun && (missing.length > 0 || mismatched.length > 0 || missingRP.length > 0)) {
            console.log("🔄 Syncing...\n");

            // Insert missing records
            let inserted = 0;
            for (const row of missing) {
                // Check if player exists in V2
                const playerExists = await v2.query(
                    `SELECT id FROM "Player" WHERE id = $1`, [row.playerId]
                );
                if (playerExists.rows.length === 0) {
                    console.log(`   ⏭️  Skipping ${playerNameMap.get(row.playerId as string) || row.playerId} — player not found in V2`);
                    continue;
                }

                // Check if season exists in V2
                if (row.seasonId) {
                    const seasonExists = await v2.query(
                        `SELECT id FROM "Season" WHERE id = $1`, [row.seasonId]
                    );
                    if (seasonExists.rows.length === 0) {
                        console.log(`   ⏭️  Skipping ${playerNameMap.get(row.playerId as string) || row.playerId} — season not found in V2`);
                        continue;
                    }
                }

                try {
                    await v2.query(
                        `INSERT INTO "RoyalPass" (id, "playerId", "seasonId", amount, "displayValue", "pricePaid", "promoCode", "createdAt")
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (id) DO NOTHING`,
                        [row.id, row.playerId, row.seasonId, row.amount, row.displayValue, row.pricePaid, row.promoCode, row.createdAt]
                    );
                    inserted++;
                    console.log(`   ✅ Inserted ${playerNameMap.get(row.playerId as string) || row.playerId} — ₹${row.pricePaid}`);
                } catch (err) {
                    console.error(`   ❌ Failed ${playerNameMap.get(row.playerId as string) || row.playerId}:`, (err as Error).message);
                }
            }

            // Fix pricePaid mismatches (V1 is source of truth)
            let updated = 0;
            for (const { v1: v1r } of mismatched) {
                try {
                    await v2.query(
                        `UPDATE "RoyalPass" SET "pricePaid" = $1 WHERE id = $2`,
                        [v1r.pricePaid, v1r.id]
                    );
                    updated++;
                    console.log(`   🔧 Fixed pricePaid for ${playerNameMap.get(v1r.playerId as string) || v1r.playerId}: → ₹${v1r.pricePaid}`);
                } catch (err) {
                    console.error(`   ❌ Failed to update ${playerNameMap.get(v1r.playerId as string) || v1r.playerId}:`, (err as Error).message);
                }
            }

            // Fix hasRoyalPass flag
            let flagsFixed = 0;
            for (const r of missingRP) {
                const playerExists = await v2.query(`SELECT id FROM "Player" WHERE id = $1`, [r.id]);
                if (playerExists.rows.length > 0) {
                    await v2.query(`UPDATE "Player" SET "hasRoyalPass" = true WHERE id = $1`, [r.id]);
                    flagsFixed++;
                    console.log(`   🏅 Fixed hasRoyalPass for ${r.name}`);
                }
            }

            console.log(`\n✅ Sync complete!`);
            console.log(`   Inserted: ${inserted} Royal Pass records`);
            console.log(`   Updated:  ${updated} pricePaid values`);
            console.log(`   Flags:    ${flagsFixed} hasRoyalPass fixed`);
        } else if (isDryRun) {
            console.log("ℹ️  Dry run — no changes made. Run without --dry-run to sync.");
        } else {
            console.log("✅ Everything is already in sync!");
        }

    } finally {
        await v1.end();
        await v2.end();
    }
}

main().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
});
