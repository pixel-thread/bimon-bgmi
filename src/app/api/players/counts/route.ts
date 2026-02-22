import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCategoryFromKDValue } from "@/lib/logic/categoryUtils";

/**
 * GET /api/players/counts
 * Returns player count per category. Lightweight endpoint for filter UI.
 */
export async function GET() {
    try {
        const players = await prisma.player.findMany({
            where: { isBanned: false },
            select: {
                stats: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    select: { kd: true },
                },
            },
        });

        const counts: Record<string, number> = {
            All: players.length,
            LEGEND: 0,
            ULTRA_PRO: 0,
            PRO: 0,
            NOOB: 0,
            ULTRA_NOOB: 0,
            BOT: 0,
        };

        for (const p of players) {
            const kd = Number(p.stats[0]?.kd ?? 0);
            const cat = getCategoryFromKDValue(kd);
            counts[cat] = (counts[cat] ?? 0) + 1;
        }

        return NextResponse.json(counts);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
