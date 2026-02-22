import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-bios
 * Preview: show v1 bios.
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        const bios = await client.query(`
            SELECT p."bio", u."clerkId", u."displayName"
            FROM "Player" p
            JOIN "User" u ON u."id" = p."userId"
            WHERE p."bio" IS NOT NULL AND p."bio" != ''
        `);

        return NextResponse.json({
            count: bios.rows.length,
            bios: bios.rows,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-bios
 * Migrate bios from v1 to v2.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });

    try {
        await client.connect();

        const v1Res = await client.query(`
            SELECT p."bio", u."clerkId"
            FROM "Player" p
            JOIN "User" u ON u."id" = p."userId"
            WHERE p."bio" IS NOT NULL AND p."bio" != ''
        `);

        let updated = 0;
        let notFound = 0;

        for (const row of v1Res.rows) {
            const user = await prisma.user.findUnique({
                where: { clerkId: row.clerkId },
                select: { player: { select: { id: true } } },
            });

            if (user?.player) {
                await prisma.player.update({
                    where: { id: user.player.id },
                    data: { bio: row.bio },
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
