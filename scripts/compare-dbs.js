const { Client } = require('pg');

async function main() {
    const v1 = new Client({
        connectionString: "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    });
    const v2 = new Client({
        connectionString: "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
    });

    await v1.connect();
    await v2.connect();

    const tId = "05d75d88-27d6-46b0-ad44-ae1e54b58fab";

    // Columns to skip for each table (v1-only columns not in v2)
    const SKIP_COLS = {
        'Match': ['name'],
        'TeamPlayerStats': ['deaths'],
    };

    function filterRow(tableName, row) {
        const skip = SKIP_COLS[tableName] || [];
        const filtered = {};
        for (const [key, val] of Object.entries(row)) {
            if (!skip.includes(key)) {
                filtered[key] = val;
            }
        }
        return filtered;
    }

    async function insertRow(client, tableName, row) {
        const filtered = filterRow(tableName, row);
        const cols = Object.keys(filtered);
        const vals = Object.values(filtered);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const colsQuoted = cols.map(c => `"${c}"`).join(', ');

        try {
            await client.query(
                `INSERT INTO "${tableName}" (${colsQuoted}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
                vals
            );
            return true;
        } catch (err) {
            console.error(`  ❌ ${tableName} insert failed:`, err.message);
            return false;
        }
    }

    // Find missing matches
    const v1Matches = await v1.query(
        `SELECT id FROM "Match" WHERE "tournamentId" = $1 ORDER BY "createdAt" ASC`, [tId]
    );
    const v2Matches = await v2.query(
        `SELECT id FROM "Match" WHERE "tournamentId" = $1`, [tId]
    );

    const v2MatchIds = new Set(v2Matches.rows.map(r => r.id));
    const missingIds = v1Matches.rows.filter(r => !v2MatchIds.has(r.id)).map(r => r.id);
    console.log(`V1: ${v1Matches.rows.length} matches, V2: ${v2Matches.rows.length} matches`);
    console.log(`Missing: ${missingIds.length} matches`);

    if (missingIds.length === 0) {
        console.log("All synced!");
        await v1.end();
        await v2.end();
        return;
    }

    for (const matchId of missingIds) {
        console.log(`\n=== Syncing Match ${matchId} ===`);

        // 1. Insert Match
        const matchRow = (await v1.query(`SELECT * FROM "Match" WHERE id = $1`, [matchId])).rows[0];
        const ok = await insertRow(v2, 'Match', matchRow);
        if (!ok) {
            console.log("  Skipping match (insert failed)");
            continue;
        }
        console.log(`  ✅ Match inserted`);

        // 2. Insert TeamStats
        const teamStats = (await v1.query(`SELECT * FROM "TeamStats" WHERE "matchId" = $1`, [matchId])).rows;
        let tsOk = 0;
        for (const ts of teamStats) {
            if (await insertRow(v2, 'TeamStats', ts)) tsOk++;

            // 3. Insert TeamPlayerStats for each TeamStats
            const tps = (await v1.query(`SELECT * FROM "TeamPlayerStats" WHERE "teamStatsId" = $1`, [ts.id])).rows;
            let tpOk = 0;
            for (const tp of tps) {
                if (await insertRow(v2, 'TeamPlayerStats', tp)) tpOk++;
            }
            console.log(`    TeamStats ${ts.id}: ${tpOk}/${tps.length} player stats`);
        }
        console.log(`  TeamStats: ${tsOk}/${teamStats.length} inserted`);

        // 4. Insert MatchPlayerPlayed
        const mpp = (await v1.query(`SELECT * FROM "MatchPlayerPlayed" WHERE "matchId" = $1`, [matchId])).rows;
        let mppOk = 0;
        for (const mp of mpp) {
            if (await insertRow(v2, 'MatchPlayerPlayed', mp)) mppOk++;
        }
        console.log(`  MatchPlayerPlayed: ${mppOk}/${mpp.length} inserted`);
    }

    // Verify
    const after = await v2.query(
        `SELECT COUNT(*) FROM "Match" WHERE "tournamentId" = $1`, [tId]
    );
    console.log(`\n=== DONE ===`);
    console.log(`V2 now has ${after.rows[0].count} matches (was ${v2Matches.rows.length})`);

    await v1.end();
    await v2.end();
}

main().catch(console.error);
