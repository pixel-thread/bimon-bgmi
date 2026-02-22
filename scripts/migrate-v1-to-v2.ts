/**
 * Data Migration Script: v1 → v2
 *
 * Ensures all existing players have:
 * 1. A Wallet record
 * 2. A PlayerStreak record
 * 3. Correct isOnboarded flag on User
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx scripts/migrate-v1-to-v2.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Starting v1 → v2 migration...\n");

    // 1. Ensure every Player has a Wallet
    const playersWithoutWallet = await prisma.player.findMany({
        where: { wallet: null },
        select: { id: true, displayName: true },
    });

    if (playersWithoutWallet.length > 0) {
        console.log(
            `📦 Creating wallets for ${playersWithoutWallet.length} players...`
        );

        for (const player of playersWithoutWallet) {
            await prisma.wallet.create({
                data: { playerId: player.id },
            });
            console.log(`  ✅ Wallet created for ${player.displayName || player.id}`);
        }
    } else {
        console.log("✅ All players already have wallets");
    }

    // 2. Ensure every Player has a PlayerStreak
    const playersWithoutStreak = await prisma.player.findMany({
        where: { streak: null },
        select: { id: true, displayName: true },
    });

    if (playersWithoutStreak.length > 0) {
        console.log(
            `🔥 Creating streaks for ${playersWithoutStreak.length} players...`
        );

        for (const player of playersWithoutStreak) {
            await prisma.playerStreak.create({
                data: { playerId: player.id },
            });
            console.log(
                `  ✅ Streak created for ${player.displayName || player.id}`
            );
        }
    } else {
        console.log("✅ All players already have streaks");
    }

    // 3. Mark Users with Players as onboarded
    const usersToOnboard = await prisma.user.findMany({
        where: {
            isOnboarded: false,
            player: { isNot: null },
        },
        select: { id: true, username: true },
    });

    if (usersToOnboard.length > 0) {
        console.log(
            `👤 Marking ${usersToOnboard.length} users as onboarded...`
        );

        await prisma.user.updateMany({
            where: {
                id: { in: usersToOnboard.map((u) => u.id) },
            },
            data: { isOnboarded: true },
        });

        for (const u of usersToOnboard) {
            console.log(`  ✅ ${u.username} marked as onboarded`);
        }
    } else {
        console.log("✅ All users with players already onboarded");
    }

    // 4. Summary stats
    const [playerCount, walletCount, streakCount, userCount] = await Promise.all([
        prisma.player.count(),
        prisma.wallet.count(),
        prisma.playerStreak.count(),
        prisma.user.count({ where: { isOnboarded: true } }),
    ]);

    console.log("\n📊 Migration Summary:");
    console.log(`  Players:        ${playerCount}`);
    console.log(`  Wallets:        ${walletCount}`);
    console.log(`  Streaks:        ${streakCount}`);
    console.log(`  Onboarded Users: ${userCount}`);
    console.log(
        `\n${playerCount === walletCount && playerCount === streakCount ? "✅ Migration complete — all records aligned!" : "⚠️  Some mismatches detected. Re-run to fix."}`
    );
}

main()
    .catch((e) => {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
