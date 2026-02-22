const { Client } = require("pg");

const V1 = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const V2 = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
    const v1 = new Client({ connectionString: V1 });
    const v2 = new Client({ connectionString: V2 });
    await v1.connect();
    await v2.connect();

    // Get v1 streak reward data for all players
    const { rows: v1Data } = await v1.query(`
        SELECT u."userName", p."pendingStreakReward", p."lastStreakRewardAt"
        FROM "Player" p
        JOIN "User" u ON p."userId" = u.id
        WHERE p."pendingStreakReward" IS NOT NULL OR p."lastStreakRewardAt" IS NOT NULL
    `);
    console.log(`V1: ${v1Data.length} players with streak reward data`);

    // Get v2 player mapping
    const { rows: v2Players } = await v2.query(`
        SELECT p.id, u.username FROM "Player" p JOIN "User" u ON p."userId" = u.id
    `);
    const v2Map = new Map(v2Players.map(r => [r.username.toLowerCase(), r.id]));

    let ok = 0;
    for (const row of v1Data) {
        const pid = v2Map.get(row.userName?.toLowerCase());
        if (!pid) continue;

        await v2.query(`
            UPDATE "PlayerStreak"
            SET "pendingReward" = $2, "lastRewardAt" = $3, "updatedAt" = NOW()
            WHERE "playerId" = $1
        `, [pid, row.pendingStreakReward, row.lastStreakRewardAt]);
        ok++;
        console.log(`  ✓ ${row.userName}: pending=${row.pendingStreakReward}, lastReward=${row.lastStreakRewardAt}`);
    }

    console.log(`\nSynced ${ok} streak rewards`);

    // Verify ksross
    const check = await v2.query(`
        SELECT ps."pendingReward", ps."lastRewardAt", u.username
        FROM "PlayerStreak" ps
        JOIN "Player" p ON ps."playerId" = p.id
        JOIN "User" u ON p."userId" = u.id
        WHERE u.username = 'ksross'
    `);
    console.log("ksross:", JSON.stringify(check.rows[0]));

    await v1.end();
    await v2.end();
}

main().catch(console.error);
