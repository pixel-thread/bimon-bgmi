import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-winners
 * Preview: show v1 tournament winners.
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        const winners = await client.query(`
            SELECT 
                tw."id", tw."amount", tw."position", tw."isDistributed",
                tw."teamId", tw."tournamentId", tw."createdAt",
                t."name" as "teamName",
                trn."name" as "tournamentName"
            FROM "TournamentWinner" tw
            JOIN "Team" t ON t."id" = tw."teamId"
            JOIN "Tournament" trn ON trn."id" = tw."tournamentId"
            ORDER BY tw."createdAt" DESC
        `);

        // Check how many already exist in v2
        const v2Count = await prisma.tournamentWinner.count();

        return NextResponse.json({
            v1Count: winners.rows.length,
            v2Count,
            winners: winners.rows.map((w) => ({
                id: w.id,
                position: w.position,
                amount: w.amount,
                teamName: w.teamName,
                tournamentName: w.tournamentName,
                isDistributed: w.isDistributed,
            })),
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-winners
 * Migrate tournament winners from v1 to v2.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });

    try {
        await client.connect();

        const v1Winners = await client.query(`
            SELECT "id", "amount", "position", "isDistributed", "teamId", "tournamentId", "createdAt"
            FROM "TournamentWinner"
        `);

        let created = 0;
        let skipped = 0;
        let errors: string[] = [];

        for (const w of v1Winners.rows) {
            // Check if team and tournament exist in v2
            const [team, tournament] = await Promise.all([
                prisma.team.findUnique({ where: { id: w.teamId }, select: { id: true } }),
                prisma.tournament.findUnique({ where: { id: w.tournamentId }, select: { id: true } }),
            ]);

            if (!team || !tournament) {
                errors.push(`Skipped: team=${w.teamId} or tournament=${w.tournamentId} not found in v2`);
                skipped++;
                continue;
            }

            // Check if already exists
            const existing = await prisma.tournamentWinner.findFirst({
                where: { tournamentId: w.tournamentId, teamId: w.teamId },
            });

            if (existing) {
                skipped++;
                continue;
            }

            await prisma.tournamentWinner.create({
                data: {
                    id: w.id,
                    amount: w.amount,
                    position: w.position,
                    isDistributed: w.isDistributed,
                    teamId: w.teamId,
                    tournamentId: w.tournamentId,
                },
            });
            created++;
        }

        return NextResponse.json({
            success: true,
            v1Count: v1Winners.rows.length,
            created,
            skipped,
            errors: errors.slice(0, 10),
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}
