/**
 * Debug: Check why entry fees differ for players who played the same tournaments.
 * Compares transaction matching against actual tournament fees.
 *
 * Usage: npx tsx scripts/debug-entry-fees.ts
 */

import pg from "pg";
import { config } from "dotenv";

config();

async function main() {
    const v2 = new pg.Client({ connectionString: process.env.DATABASE_URL! });
    await v2.connect();

    // Get active season
    const season = await v2.query(
        `SELECT id, name FROM "Season" WHERE status = 'ACTIVE' LIMIT 1`
    );
    const seasonId = season.rows[0].id;
    console.log("Season:", season.rows[0].name);

    // Get tournaments + fees
    const tournaments = await v2.query(
        `SELECT id, name, fee FROM "Tournament" WHERE "seasonId" = $1 ORDER BY "startDate"`,
        [seasonId]
    );
    console.log("\n📋 Tournaments in season:");
    for (const t of tournaments.rows) {
        console.log(`  ${t.name}: fee = ₹${t.fee ?? "NULL"}`);
    }
    const totalPossibleFees = tournaments.rows.reduce(
        (sum: number, t: any) => sum + (t.fee || 0),
        0
    );
    console.log(`  Total possible fees (all 11): ₹${totalPossibleFees}`);

    // Pick a specific player (RKO 叱CM PUNK✓요 — rank 1 loser)
    const playerId = "41bf157d-eac0-46f8-bdea-92562c2d284a"; // from API response
    const playerName = "RKO 亗CM PUNK✓모";

    // Get ALL transactions for this player
    const txns = await v2.query(
        `SELECT type, amount, description FROM "Transaction" WHERE "playerId" = $1 ORDER BY "createdAt"`,
        [playerId]
    );
    console.log(`\n🔍 ${playerName}: ${txns.rows.length} total transactions`);

    // Filter entry fee transactions
    const entryTxns = txns.rows.filter(
        (tx: any) =>
            tx.description.toLowerCase().includes("entry") &&
            (tx.type === "debit" || tx.type === "DEBIT")
    );
    console.log(`  Entry fee transactions: ${entryTxns.length}`);
    for (const tx of entryTxns) {
        console.log(`    [${tx.type}] ₹${tx.amount} — "${tx.description}"`);
    }

    // Check which ones match season tournaments
    const tournamentNames = tournaments.rows.map((t: any) => t.name);
    const matchingEntry = entryTxns.filter((tx: any) =>
        tournamentNames.some(
            (name: string) =>
                tx.description === `Entry fee for ${name}` ||
                tx.description.endsWith(`: ${name}`)
        )
    );
    console.log(`  Matching season tournaments: ${matchingEntry.length}`);

    // Show NON-matching entry fees
    const nonMatching = entryTxns.filter(
        (tx: any) =>
            !tournamentNames.some(
                (name: string) =>
                    tx.description === `Entry fee for ${name}` ||
                    tx.description.endsWith(`: ${name}`)
            )
    );
    if (nonMatching.length > 0) {
        console.log(`  ⚠️ Non-matching entry fees:`);
        for (const tx of nonMatching) {
            console.log(`    ₹${tx.amount} — "${tx.description}"`);
        }
    }

    // Check lucky voter status for this player
    const luckyVoter = await v2.query(
        `SELECT p.id, t.name FROM "Poll" p JOIN "Tournament" t ON t.id = p."tournamentId" WHERE p."luckyVoterId" = $1 AND t."seasonId" = $2`,
        [playerId, seasonId]
    );
    if (luckyVoter.rows.length > 0) {
        console.log(`  🍀 Lucky voter in: ${luckyVoter.rows.map((r: any) => r.name).join(", ")}`);
    }

    // Check UC exempt
    const exempt = await v2.query(
        `SELECT "isUCExempt" FROM "Player" WHERE id = $1`,
        [playerId]
    );
    console.log(`  UC Exempt: ${exempt.rows[0]?.isUCExempt}`);

    // Now do the same for the first 3 losers
    const top3 = [
        { id: "41bf157d-eac0-46f8-bdea-92562c2d284a", name: "RKO 亗CM PUNK✓모" },
        { id: "3efd7245-1170-4d1f-89b5-ae114daff8e5", name: "KŚツNàngiài" },
        { id: "734b3dbf-49fc-4968-b085-602fa9553845", name: "々IG々Brozia乄" },
    ];

    console.log("\n📊 Summary for top 3 losers:");
    for (const player of top3) {
        const allTx = await v2.query(
            `SELECT type, amount, description FROM "Transaction" WHERE "playerId" = $1`,
            [player.id]
        );
        const entries = allTx.rows.filter(
            (tx: any) =>
                (tx.type === "debit" || tx.type === "DEBIT") &&
                tx.description.toLowerCase().includes("entry")
        );
        const seasonEntries = entries.filter((tx: any) =>
            tournamentNames.some(
                (name: string) =>
                    tx.description === `Entry fee for ${name}` ||
                    tx.description.endsWith(`: ${name}`)
            )
        );
        const lv = await v2.query(
            `SELECT t.name FROM "Poll" p JOIN "Tournament" t ON t.id = p."tournamentId" WHERE p."luckyVoterId" = $1 AND t."seasonId" = $2`,
            [player.id, seasonId]
        );

        console.log(
            `  ${player.name}: ${entries.length} entry txns total, ${seasonEntries.length} match season, lucky=${lv.rows.length}, total=₹${seasonEntries.reduce((s: number, t: any) => s + t.amount, 0)}`
        );
    }

    await v2.end();
}

main().catch(console.error);
