/**
 * One-time migration: Seed central wallet from BGMI + PES local databases.
 * Each player gets the SUM of their balances across both games.
 * 
 * Usage: cd /Users/second/Downloads/bimon-bgmi-v2 && npx tsx scripts/migrate-wallets.ts
 */

import "dotenv/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient: GamePrisma } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WalletPrisma = require(".prisma/wallet-client");
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const WALLET_URL = process.env.WALLET_DATABASE_URL!;
const BGMI_URL = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const PES_URL = "postgresql://postgres.svbdazapxgujekqnwtwz:lRwMQioGddNcGXLg@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function migrate() {
    const walletPool = new Pool({ connectionString: WALLET_URL });
    const bgmiPool = new Pool({ connectionString: BGMI_URL });
    const pesPool = new Pool({ connectionString: PES_URL });

    const walletDb = new WalletPrisma.PrismaClient({ adapter: new PrismaPg(walletPool) });
    const bgmiDb = new GamePrisma({ adapter: new PrismaPg(bgmiPool) });
    const pesDb = new GamePrisma({ adapter: new PrismaPg(pesPool) });

    console.log("📊 Fetching players from BGMI...");
    const bgmiPlayers = await bgmiDb.user.findMany({
        where: { isOnboarded: true, email: { not: null } },
        include: { player: { include: { wallet: true } } },
    });
    console.log(`  Found ${bgmiPlayers.length} BGMI players`);

    console.log("📊 Fetching players from PES...");
    const pesPlayers = await pesDb.user.findMany({
        where: { isOnboarded: true, email: { not: null } },
        include: { player: { include: { wallet: true } } },
    });
    console.log(`  Found ${pesPlayers.length} PES players`);

    // Build email → combined balance map (SUM of both games)
    const balanceMap = new Map<string, { bgmi: number; pes: number; name: string | null; imageUrl: string | null }>();

    for (const u of bgmiPlayers) {
        if (!u.email) continue;
        const bal = u.player?.wallet?.balance ?? 0;
        const existing = balanceMap.get(u.email) || { bgmi: 0, pes: 0, name: null, imageUrl: null };
        existing.bgmi = bal;
        existing.name = existing.name || u.player?.displayName || u.username;
        existing.imageUrl = existing.imageUrl || u.imageUrl;
        balanceMap.set(u.email, existing);
    }

    for (const u of pesPlayers) {
        if (!u.email) continue;
        const bal = u.player?.wallet?.balance ?? 0;
        const existing = balanceMap.get(u.email) || { bgmi: 0, pes: 0, name: null, imageUrl: null };
        existing.pes = bal;
        existing.name = existing.name || u.player?.displayName || u.username;
        existing.imageUrl = existing.imageUrl || u.imageUrl;
        balanceMap.set(u.email, existing);
    }

    console.log(`\n🔄 Migrating ${balanceMap.size} unique players to central wallet...\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [email, data] of balanceMap) {
        const totalBalance = data.bgmi + data.pes;
        try {
            const existing = await walletDb.centralUser.findUnique({
                where: { email },
                include: { wallet: true },
            });

            if (!existing) {
                await walletDb.centralUser.create({
                    data: {
                        email,
                        name: data.name,
                        imageUrl: data.imageUrl,
                        wallet: { create: { balance: totalBalance } },
                    },
                });
                created++;
                if (totalBalance > 0) {
                    console.log(`  ✅ ${email}: BGMI=${data.bgmi} + PES=${data.pes} = ${totalBalance}`);
                }
            } else if (existing.wallet && totalBalance > existing.wallet.balance) {
                await walletDb.centralWallet.update({
                    where: { id: existing.wallet.id },
                    data: { balance: totalBalance },
                });
                updated++;
                console.log(`  ⬆️  ${email}: ${existing.wallet.balance} → ${totalBalance} (BGMI=${data.bgmi} + PES=${data.pes})`);
            } else {
                skipped++;
            }
        } catch (err: any) {
            console.error(`  ❌ ${email}: ${err.message}`);
        }
    }

    console.log(`\n📋 Migration complete:`);
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⬆️  Updated: ${updated}`);
    console.log(`  ⏭️  Skipped (already correct): ${skipped}`);

    await walletDb.$disconnect();
    await bgmiDb.$disconnect();
    await pesDb.$disconnect();
    await walletPool.end();
    await bgmiPool.end();
    await pesPool.end();
}

migrate().catch(console.error);
