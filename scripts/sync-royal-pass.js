/**
 * Sync RoyalPass data from v1 to v2.
 * Matches players by v1 User.userName → v2 User.username.
 */
const { Client } = require("pg");

const V1 = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const V2 = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
    const v1 = new Client({ connectionString: V1 });
    const v2 = new Client({ connectionString: V2 });
    await v1.connect();
    await v2.connect();

    // 1. Fetch v1 Royal Pass + userName for matching
    const { rows: v1Passes } = await v1.query(`
        SELECT rp."pricePaid", rp.amount, rp."displayValue", rp."promoCode", rp."createdAt",
               u."userName"
        FROM "RoyalPass" rp
        JOIN "Player" p ON rp."playerId" = p.id
        JOIN "User" u ON p."userId" = u.id
        ORDER BY rp."createdAt" DESC
    `);
    console.log(`V1: ${v1Passes.length} passes`);

    // 2. Build v2 username → playerId map
    const { rows: v2Players } = await v2.query(`
        SELECT p.id, u.username FROM "Player" p JOIN "User" u ON p."userId" = u.id
    `);
    const playerMap = new Map(v2Players.map(p => [p.username.toLowerCase(), p.id]));

    // 3. Build season name map (v1 name → v2 id)
    const { rows: v1Seasons } = await v1.query(`SELECT id, name FROM "Season"`);
    const { rows: v2Seasons } = await v2.query(`SELECT id, name FROM "Season"`);
    const seasonMap = new Map();
    for (const s of v1Seasons) {
        const match = v2Seasons.find(s2 => s2.name === s.name);
        if (match) seasonMap.set(s.id, match.id);
    }

    // Also get v1 seasonId for each pass
    const { rows: v1PassesFull } = await v1.query(`
        SELECT rp."seasonId", rp."pricePaid", rp.amount, rp."displayValue", rp."promoCode", rp."createdAt",
               u."userName"
        FROM "RoyalPass" rp
        JOIN "Player" p ON rp."playerId" = p.id
        JOIN "User" u ON p."userId" = u.id
        ORDER BY rp."createdAt" DESC
    `);

    // 4. Clear + reinsert
    await v2.query(`DELETE FROM "RoyalPass"`);
    let ok = 0, skip = 0;

    for (const rp of v1PassesFull) {
        const pid = playerMap.get(rp.userName?.toLowerCase());
        if (!pid) { console.log(`  ⚠ ${rp.userName}: not in v2`); skip++; continue; }

        const sid = rp.seasonId ? seasonMap.get(rp.seasonId) : null;
        await v2.query(
            `INSERT INTO "RoyalPass" (id,"playerId","seasonId",amount,"displayValue","pricePaid","promoCode","createdAt")
             VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7)`,
            [pid, sid, rp.amount, rp.displayValue, rp.pricePaid, rp.promoCode, rp.createdAt]
        );
        ok++;
        console.log(`  ✓ ${rp.userName}: paid=${rp.pricePaid} amount=${rp.amount} display=${rp.displayValue}`);
    }

    console.log(`\n${ok} synced, ${skip} skipped`);
    await v1.end();
    await v2.end();
}

main().catch(console.error);
