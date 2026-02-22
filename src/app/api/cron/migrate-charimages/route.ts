import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/cron/migrate-charimages — Debug: show v1 character image data
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        // Get all v1 players with character images, joined with Gallery and User (for clerkId)
        const res = await client.query(`
            SELECT 
                u."clerkId",
                u."displayName",
                g."id" as "galleryId",
                g."imageId",
                g."name",
                g."path",
                g."fullPath",
                g."publicUrl",
                g."isAnimated",
                g."isVideo",
                g."thumbnailUrl"
            FROM "Player" p
            JOIN "User" u ON p."userId" = u."id"
            JOIN "Gallery" g ON p."characterImageId" = g."id"
        `);

        return NextResponse.json({
            count: res.rows.length,
            data: res.rows,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}

/**
 * POST /api/cron/migrate-charimages — Migrate character images from v1
 * Creates Gallery records in v2 and links them to the matching players.
 */
export async function POST() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });
    try {
        await client.connect();

        // Get all v1 players with character images
        const v1Res = await client.query(`
            SELECT 
                u."clerkId",
                g."imageId",
                g."name",
                g."path",
                g."fullPath",
                g."publicUrl",
                g."isAnimated",
                g."isVideo",
                g."thumbnailUrl"
            FROM "Player" p
            JOIN "User" u ON p."userId" = u."id"
            JOIN "Gallery" g ON p."characterImageId" = g."id"
        `);

        if (v1Res.rows.length === 0) {
            return NextResponse.json({ message: "No character images found in v1" });
        }

        // Get v2 players matched by clerkId
        const v2Players = await prisma.player.findMany({
            select: {
                id: true,
                characterImageId: true,
                displayName: true,
                user: { select: { clerkId: true } },
            },
        });

        let created = 0;
        let linked = 0;
        let skipped = 0;
        const changes: string[] = [];

        for (const v1 of v1Res.rows) {
            const v2Player = v2Players.find((p) => p.user.clerkId === v1.clerkId);
            if (!v2Player) {
                skipped++;
                continue;
            }

            // Skip if player already has a character image
            if (v2Player.characterImageId) {
                skipped++;
                continue;
            }

            // Check if Gallery record already exists in v2 (by imageId)
            let gallery = await prisma.gallery.findUnique({
                where: { imageId: v1.imageId },
            });

            if (!gallery) {
                // Create the Gallery record in v2
                gallery = await prisma.gallery.create({
                    data: {
                        imageId: v1.imageId,
                        name: v1.name,
                        path: v1.path,
                        fullPath: v1.fullPath,
                        publicUrl: v1.publicUrl,
                        isCharacterImg: true,
                        isAnimated: v1.isAnimated ?? false,
                        isVideo: v1.isVideo ?? false,
                        thumbnailUrl: v1.thumbnailUrl,
                    },
                });
                created++;
            }

            // Link player to the gallery record
            await prisma.player.update({
                where: { id: v2Player.id },
                data: { characterImageId: gallery.id },
            });
            linked++;
            changes.push(`${v2Player.displayName || "(unnamed)"} → ${v1.publicUrl?.slice(-30)}`);
        }

        return NextResponse.json({
            v1Count: v1Res.rows.length,
            created,
            linked,
            skipped,
            changes,
        });
    } catch (error) {
        console.error("Char image migration error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    } finally {
        await client.end();
    }
}
