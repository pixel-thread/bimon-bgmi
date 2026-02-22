import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/cron/fix-categories
 * One-time fix: update all player categories based on their latest K/D.
 * Also runs as part of regular category maintenance.
 */
export async function POST() {
    try {
        const players = await prisma.player.findMany({
            select: {
                id: true,
                displayName: true,
                category: true,
                stats: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    select: { kills: true, kd: true },
                },
            },
        });

        const thresholds = [
            { min: 1.7, cat: "LEGEND" },
            { min: 1.5, cat: "ULTRA_PRO" },
            { min: 1.0, cat: "PRO" },
            { min: 0.5, cat: "NOOB" },
            { min: 0.2, cat: "ULTRA_NOOB" },
        ];

        let updated = 0;
        const changes: string[] = [];

        for (const p of players) {
            const kd = p.stats[0] ? Number(p.stats[0].kd) : 0;
            const kills = p.stats[0]?.kills ?? 0;

            let newCat = "BOT";
            if (kd === 0 && kills === 0) {
                newCat = "BOT";
            } else {
                for (const t of thresholds) {
                    if (kd >= t.min) {
                        newCat = t.cat;
                        break;
                    }
                }
            }

            if (p.category !== newCat) {
                await prisma.player.update({
                    where: { id: p.id },
                    data: { category: newCat as any },
                });
                changes.push(`${p.displayName || p.id}: ${p.category} → ${newCat} (KD: ${kd.toFixed(2)})`);
                updated++;
            }
        }

        return NextResponse.json({
            updated,
            total: players.length,
            changes,
        });
    } catch (error) {
        console.error("Failed to fix categories:", error);
        return NextResponse.json({ error: "Failed to fix categories" }, { status: 500 });
    }
}
