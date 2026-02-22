// Test the actual Prisma groupBy query to debug why it's returning wrong results
import { prisma } from "@/lib/database";

async function main() {
    const tournamentId = "4129462f-a2b8-40b1-8130-f626e46f003f";

    // Step 1: Get match IDs
    const matches = await prisma.match.findMany({
        where: { tournamentId },
        select: { id: true },
    });
    const matchIds = matches.map(m => m.id);
    console.log("Match IDs:", matchIds, "count:", matchIds.length);

    // Step 2: Test groupBy with matchId filter
    const result = await prisma.teamPlayerStats.groupBy({
        by: ["playerId"],
        where: {
            matchId: { in: matchIds },
        },
        _count: { matchId: true },
    });
    console.log("GroupBy result:", result.slice(0, 5));

    // Step 3: Also try findMany to count
    const allStats = await prisma.teamPlayerStats.findMany({
        where: { matchId: { in: matchIds } },
        select: { playerId: true, matchId: true },
    });
    console.log("Total TeamPlayerStats records:", allStats.length);

    // Manual groupBy
    const countMap = new Map<string, number>();
    for (const s of allStats) {
        countMap.set(s.playerId, (countMap.get(s.playerId) || 0) + 1);
    }
    console.log("Manual count (first 5):",
        Array.from(countMap.entries()).slice(0, 5).map(([pid, count]) => ({ playerId: pid, count }))
    );

    // Also test: what does the tax-preview API see?
    // Get first team's player IDs
    const teamStats = await prisma.teamStats.findMany({
        where: { tournamentId },
        include: {
            teamPlayerStats: { select: { playerId: true } },
        },
        take: 3,
    });

    const firstTeamPlayerIds = [...new Set(teamStats.flatMap(ts => ts.teamPlayerStats.map(tps => tps.playerId)))].slice(0, 5);
    console.log("\nFirst team player IDs:", firstTeamPlayerIds);

    // Test the exact query the tax-preview uses
    const taxResult = await prisma.teamPlayerStats.groupBy({
        by: ["playerId"],
        where: {
            playerId: { in: firstTeamPlayerIds },
            matchId: { in: matchIds },
        },
        _count: { matchId: true },
    });
    console.log("Tax-preview style groupBy:", taxResult);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
