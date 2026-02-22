import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-displaynames
 * Debug: show v1 table structure and sample data.
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();
        // List all public tables
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name
        `);

        // Check if Player has characterImageId and what it links to
        const playerSample = await client.query(`
            SELECT "id", "userId", "characterImageId", "customProfileImageUrl"
            FROM "Player" 
            WHERE "characterImageId" IS NOT NULL
            LIMIT 5
        `);

        return NextResponse.json({
            tables: tables.rows.map((r: { table_name: string }) => r.table_name),
            playersWithCharImg: playerSample.rows,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-displaynames
 * Pull displayName from v1 database and update v2 players.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });

    try {
        await client.connect();

        // Get displayName and clerkId from v1 User table
        const v1Res = await client.query(
            `SELECT "displayName", "clerkId" FROM "User" WHERE "displayName" IS NOT NULL`
        );

        // Get v2 players
        const v2Players = await prisma.player.findMany({
            select: {
                id: true,
                displayName: true,
                user: { select: { clerkId: true } },
            },
        });

        let updated = 0;
        const changes: string[] = [];

        for (const v2 of v2Players) {
            const v1Match = v1Res.rows.find(
                (v1: { clerkId: string }) => v1.clerkId === v2.user.clerkId
            );
            if (v1Match?.displayName && v1Match.displayName !== v2.displayName) {
                await prisma.player.update({
                    where: { id: v2.id },
                    data: { displayName: v1Match.displayName },
                });
                changes.push(`${v2.displayName || "(null)"} → ${v1Match.displayName}`);
                updated++;
            }
        }

        return NextResponse.json({
            v1Count: v1Res.rows.length,
            v2Count: v2Players.length,
            updated,
            changes,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}
