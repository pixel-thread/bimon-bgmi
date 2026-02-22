import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-profile-images
 * Preview: show v1 players with customProfileImageUrl set
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        // Check v1 players with customProfileImageUrl
        const v1Data = await client.query(`
            SELECT p."customProfileImageUrl", u."clerkId"
            FROM "Player" p
            JOIN "User" u ON p."userId" = u."id"
            WHERE p."customProfileImageUrl" IS NOT NULL
        `);

        return NextResponse.json({
            v1PlayersWithCustomImage: v1Data.rows.length,
            sample: v1Data.rows.slice(0, 10),
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-profile-images
 * Migrate customProfileImageUrl from v1 to v2 by matching clerkId.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        // Get v1 players with custom profile images
        const v1Data = await client.query(`
            SELECT p."customProfileImageUrl", u."clerkId"
            FROM "Player" p
            JOIN "User" u ON p."userId" = u."id"
            WHERE p."customProfileImageUrl" IS NOT NULL
        `);

        // Get v2 players
        const v2Players = await prisma.player.findMany({
            select: {
                id: true,
                customProfileImageUrl: true,
                user: { select: { clerkId: true } },
            },
        });

        let updated = 0;
        const changes: string[] = [];

        for (const v2 of v2Players) {
            const v1Match = v1Data.rows.find(
                (v1: { clerkId: string }) => v1.clerkId === v2.user.clerkId
            );
            if (v1Match?.customProfileImageUrl && !v2.customProfileImageUrl) {
                await prisma.player.update({
                    where: { id: v2.id },
                    data: { customProfileImageUrl: v1Match.customProfileImageUrl },
                });
                changes.push(`${v2.id}: ${v1Match.customProfileImageUrl}`);
                updated++;
            }
        }

        return NextResponse.json({
            v1WithCustomImage: v1Data.rows.length,
            v2Updated: updated,
            changes,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}
