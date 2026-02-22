/**
 * One-time script to fix match numbers.
 * 
 * Problem: matchNumber uses global autoincrement, so matches across all
 * tournaments share a single counter (Match #159, #160, etc.).
 * 
 * Fix: Re-number matches per-tournament as 1, 2, 3... based on creation order.
 * 
 * Usage: npx tsx scripts/fix-match-numbers.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔧 Fixing match numbers...\n");

    // Get all tournaments that have matches
    const tournaments = await prisma.tournament.findMany({
        select: { id: true, name: true },
        where: { matches: { some: {} } },
        orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${tournaments.length} tournaments with matches.\n`);

    let totalUpdated = 0;

    for (const tournament of tournaments) {
        // Get matches for this tournament, ordered by creation
        const matches = await prisma.match.findMany({
            where: { tournamentId: tournament.id },
            orderBy: { createdAt: "asc" },
            select: { id: true, matchNumber: true },
        });

        let updated = 0;
        for (let i = 0; i < matches.length; i++) {
            const correctNumber = i + 1;
            if (matches[i].matchNumber !== correctNumber) {
                await prisma.match.update({
                    where: { id: matches[i].id },
                    data: { matchNumber: correctNumber },
                });
                updated++;
            }
        }

        if (updated > 0) {
            console.log(
                `  ✅ ${tournament.name}: ${matches.length} matches, ${updated} renumbered`
            );
        } else {
            console.log(
                `  ⏭️  ${tournament.name}: ${matches.length} matches, already correct`
            );
        }
        totalUpdated += updated;
    }

    console.log(`\n🎉 Done! Updated ${totalUpdated} matches total.`);
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
