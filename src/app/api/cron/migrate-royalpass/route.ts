import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-royalpass
 * Preview: show v1 Royal Pass holders.
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        // Check Player columns
        const playerCols = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'Player' AND column_name ILIKE '%royal%'
        `);

        // Check RoyalPass table columns
        const rpCols = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'RoyalPass'
        `);

        // Get RoyalPass records
        const rpData = await client.query(`
            SELECT rp.*, u."clerkId"
            FROM "RoyalPass" rp
            JOIN "Player" p ON p."id" = rp."playerId"
            JOIN "User" u ON u."id" = p."userId"
            LIMIT 20
        `);

        return NextResponse.json({
            playerRoyalColumns: playerCols.rows,
            royalPassColumns: rpCols.rows,
            royalPassData: rpData.rows,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-royalpass
 * Migrate hasRoyalPass from v1 to v2.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });

    try {
        await client.connect();

        // Get RP holders from v1 RoyalPass table
        const v1Res = await client.query(`
            SELECT DISTINCT u."clerkId"
            FROM "RoyalPass" rp
            JOIN "Player" p ON p."id" = rp."playerId"
            JOIN "User" u ON u."id" = p."userId"
        `);

        let updated = 0;
        let notFound = 0;

        for (const row of v1Res.rows) {
            // Find v2 user by clerkId
            const user = await prisma.user.findUnique({
                where: { clerkId: row.clerkId },
                select: { player: { select: { id: true } } },
            });

            if (user?.player) {
                await prisma.player.update({
                    where: { id: user.player.id },
                    data: { hasRoyalPass: true },
                });
                updated++;
            } else {
                notFound++;
            }
        }

        return NextResponse.json({
            success: true,
            v1Count: v1Res.rows.length,
            updated,
            notFound,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}
