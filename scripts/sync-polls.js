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

    console.log("Connected to both databases\n");

    // Get all polls from v1
    const v1Polls = await v1.query(`
        SELECT id, "isActive", "teamType", question, days
        FROM "Poll"
        ORDER BY "createdAt" DESC
    `);

    console.log(`V1 has ${v1Polls.rows.length} polls\n`);

    let updated = 0;
    let skipped = 0;

    for (const v1Poll of v1Polls.rows) {
        // Check v2
        const v2Poll = await v2.query(`SELECT id, "isActive", "teamType" FROM "Poll" WHERE id = $1`, [v1Poll.id]);

        if (v2Poll.rows.length === 0) {
            console.log(`⚠️  Poll ${v1Poll.id} not in v2 (skipping)`);
            skipped++;
            continue;
        }

        const v2Data = v2Poll.rows[0];
        const changes = [];

        if (v1Poll.isActive !== v2Data.isActive) {
            changes.push(`isActive: ${v2Data.isActive} → ${v1Poll.isActive}`);
        }
        if (v1Poll.teamType !== v2Data.teamType) {
            changes.push(`teamType: ${v2Data.teamType} → ${v1Poll.teamType}`);
        }

        if (changes.length > 0) {
            await v2.query(
                `UPDATE "Poll" SET "isActive" = $1, "teamType" = $2 WHERE id = $3`,
                [v1Poll.isActive, v1Poll.teamType, v1Poll.id]
            );
            console.log(`✅ ${v1Poll.question?.substring(0, 40)} — ${changes.join(', ')}`);
            updated++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated: ${updated}, Skipped: ${skipped}, Unchanged: ${v1Polls.rows.length - updated - skipped}`);

    await v1.end();
    await v2.end();
}

main().catch(console.error);
