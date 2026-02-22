import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/cron/fix-displaynames
 * Backfill displayName from username for players with null displayName.
 */
export async function POST() {
    try {
        const players = await prisma.player.findMany({
            where: { displayName: null },
            select: {
                id: true,
                user: { select: { username: true } },
            },
        });

        let updated = 0;
        for (const p of players) {
            if (p.user.username) {
                await prisma.player.update({
                    where: { id: p.id },
                    data: { displayName: p.user.username },
                });
                updated++;
            }
        }

        return NextResponse.json({ updated, total: players.length });
    } catch (error) {
        console.error("Failed to fix displayNames:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
