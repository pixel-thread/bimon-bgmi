import "dotenv/config";
import pg from "pg";

const v2 = new pg.Pool({ connectionString: process.env.DATABASE_URL! });

async function main() {
    const result = await v2.query(`
        SELECT t.name, t.status,
            (SELECT COUNT(*) FROM "Team" WHERE "tournamentId" = t.id) as teams,
            (SELECT COUNT(*) FROM "Match" WHERE "tournamentId" = t.id) as matches,
            (SELECT COUNT(*) FROM "TournamentWinner" WHERE "tournamentId" = t.id) as winners,
            (SELECT COUNT(*) FROM "TeamStats" WHERE "tournamentId" = t.id) as teamstats
        FROM "Tournament" t
        WHERE t.name LIKE '%Lehkai sngewtynnad 10%'
        OR t.name LIKE '%sngewtynnad%'
        ORDER BY t."createdAt" DESC
        LIMIT 5
    `);

    console.log("Tournament data in V2:");
    for (const row of result.rows) {
        console.log(`  ${row.name} (${row.status}): ${row.teams} teams, ${row.matches} matches, ${row.winners} winners, ${row.teamstats} teamStats`);
    }

    await v2.end();
}

main().catch(console.error);
