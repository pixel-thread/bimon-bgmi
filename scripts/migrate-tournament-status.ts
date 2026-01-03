// One-time migration script to mark completed tournaments as INACTIVE
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-tournament-status.ts

import { prisma } from "../src/lib/db/prisma";

async function main() {
    // Find all tournaments that have distributed winners
    const completedTournaments = await prisma.tournamentWinner.findMany({
        where: { isDistributed: true },
        select: { tournamentId: true },
        distinct: ["tournamentId"],
    });

    const tournamentIds = completedTournaments.map((t: { tournamentId: string }) => t.tournamentId);

    if (tournamentIds.length === 0) {
        console.log("No completed tournaments found to migrate.");
        return;
    }

    // Update them to INACTIVE
    const result = await prisma.tournament.updateMany({
        where: { id: { in: tournamentIds } },
        data: { status: "INACTIVE" },
    });

    console.log(`✅ Migrated ${result.count} tournaments to INACTIVE status.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
