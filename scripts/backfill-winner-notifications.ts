import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function main() {
    // Find all unclaimed WINNER rewards
    const rewards = await prisma.pendingReward.findMany({
        where: { type: "WINNER", isClaimed: false },
        include: {
            player: { select: { id: true, userId: true, displayName: true } },
        },
    });

    console.log(`Found ${rewards.length} unclaimed WINNER rewards:\n`);
    for (const r of rewards) {
        console.log(`  ${r.player.displayName} — ${r.amount} UC (${getOrdinal(r.position ?? 0)}) — "${r.message}"`);
    }

    if (rewards.length === 0) {
        console.log("Nothing to do.");
        process.exit(0);
    }

    let created = 0;
    let skipped = 0;

    for (const reward of rewards) {
        const tournamentName = reward.message?.replace(/^\d+(st|nd|rd|th) Place - /, "") || "";

        // Check if notification already exists
        const existing = await prisma.notification.findFirst({
            where: {
                playerId: reward.playerId,
                type: "tournament",
                message: { contains: tournamentName },
            },
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.notification.create({
            data: {
                userId: reward.player.userId,
                playerId: reward.player.id,
                title: `🏆 You won ${getOrdinal(reward.position ?? 0)} place!`,
                message: `You earned ${reward.amount} UC in ${tournamentName}. Tap to claim your reward!`,
                type: "tournament",
                link: "/notifications",
            },
        });
        created++;
        console.log(`  ✅ Created notification for ${reward.player.displayName} (${tournamentName})`);
    }

    console.log(`\nDone! Created ${created} notifications, skipped ${skipped} (already existed).`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
