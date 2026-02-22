const { Client } = require("pg");

const V1 = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const V2 = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
    const v1 = new Client({ connectionString: V1 });
    const v2 = new Client({ connectionString: V2 });
    await v1.connect();
    await v2.connect();

    const { rows: v1Streaks } = await v1.query(`
        SELECT u."userName", p."tournamentStreak"
        FROM "Player" p JOIN "User" u ON p."userId" = u.id
        WHERE p."tournamentStreak" IS NOT NULL
    `);

    const { rows: v2Players } = await v2.query(`
        SELECT p.id, u.username FROM "Player" p JOIN "User" u ON p."userId" = u.id
    `);
    const v2Map = new Map(v2Players.map(r => [r.username.toLowerCase(), r.id]));

    let ok = 0;
    for (const row of v1Streaks) {
        const pid = v2Map.get(row.userName?.toLowerCase());
        if (!pid) continue;
        await v2.query(`
            INSERT INTO "PlayerStreak" (id, "playerId", "current", longest, "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $2, NOW())
            ON CONFLICT ("playerId") DO UPDATE SET "current" = $2, "updatedAt" = NOW()
        `, [pid, row.tournamentStreak]);
        ok++;
    }
    console.log(`Synced ${ok} streaks`);

    // Verify ksross
    const check = await v2.query(`
        SELECT ps."current", u.username
        FROM "PlayerStreak" ps
        JOIN "Player" p ON ps."playerId" = p.id
        JOIN "User" u ON p."userId" = u.id
        WHERE u.username = 'ksross'
    `);
    console.log("ksross v2 streak:", check.rows[0]?.current);

    await v1.end();
    await v2.end();
}

main().catch(console.error);
