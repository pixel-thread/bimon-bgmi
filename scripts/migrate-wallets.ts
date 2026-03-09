/**
 * ════════════════════════════════════════════════════════════
 *  Wallet Migration Script
 *  
 *  READS from existing game databases (Supabase) — READ-ONLY
 *  WRITES to the new central wallet DB (Neon)
 *  
 *  Run: npx tsx scripts/migrate-wallets.ts
 * ════════════════════════════════════════════════════════════
 */

import "dotenv/config";
import pg from "pg";

// ─── Database connections ────────────────────────────────────

// Game databases (READ-ONLY — we only SELECT from these)
const GAME_DBS: { game: string; url: string }[] = [
    {
        game: "bgmi",
        url: "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
    {
        game: "pes",
        url: "postgresql://postgres.svbdazapxgujekqnwtwz:lRwMQioGddNcGXLg@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
    {
        game: "freefire",
        url: "postgresql://postgres.cebofvqlcdncsvypvalt:BIMONLANGg1.@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
];

// Central wallet DB (WRITE — this is the new empty Neon DB)
const WALLET_DB_URL = process.env.WALLET_DATABASE_URL!;

// ─── Types ───────────────────────────────────────────────────

interface GamePlayer {
    email: string;
    username: string;
    imageUrl: string | null;
    displayName: string | null;
    balance: number;
    game: string;
}

interface GameTransaction {
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string;
    createdAt: Date;
    game: string;
    email: string;
}

// ─── Main migration ─────────────────────────────────────────

async function migrate() {
    console.log("🔄 Starting wallet migration...\n");

    // 1. Collect all players and transactions from all game DBs
    const allPlayers: GamePlayer[] = [];
    const allTransactions: GameTransaction[] = [];

    for (const { game, url } of GAME_DBS) {
        console.log(`📖 Reading from ${game.toUpperCase()} database...`);
        const pool = new pg.Pool({ connectionString: url, max: 3 });

        try {
            // Get players with wallets and user emails
            const playersResult = await pool.query(`
                SELECT 
                    u.email,
                    u.username,
                    u."imageUrl",
                    p."displayName",
                    COALESCE(w.balance, 0) as balance
                FROM "User" u
                JOIN "Player" p ON p."userId" = u.id
                LEFT JOIN "Wallet" w ON w."playerId" = p.id
                WHERE u.email IS NOT NULL
            `);

            const players = playersResult.rows.map((row: any) => ({
                email: row.email as string,
                username: row.username as string,
                imageUrl: row.imageUrl as string | null,
                displayName: row.displayName as string | null,
                balance: Number(row.balance),
                game,
            }));
            allPlayers.push(...players);
            console.log(`   Found ${players.length} players`);

            // Get all transactions
            const txResult = await pool.query(`
                SELECT 
                    t.amount,
                    t.type,
                    t.description,
                    t."createdAt",
                    u.email
                FROM "Transaction" t
                JOIN "Player" p ON p.id = t."playerId"
                JOIN "User" u ON u.id = p."userId"
                WHERE u.email IS NOT NULL
                ORDER BY t."createdAt" ASC
            `);

            const transactions = txResult.rows.map((row: any) => ({
                amount: Number(row.amount),
                type: row.type as "CREDIT" | "DEBIT",
                description: row.description as string,
                createdAt: new Date(row.createdAt),
                game,
                email: row.email as string,
            }));
            allTransactions.push(...transactions);
            console.log(`   Found ${transactions.length} transactions`);
        } catch (err: any) {
            console.warn(`   ⚠️  Could not read ${game}: ${err.message}`);
        } finally {
            await pool.end();
        }
    }

    console.log(`\n📊 Total: ${allPlayers.length} players, ${allTransactions.length} transactions across all games`);

    // 2. Group by email to identify unique users
    const userMap = new Map<string, {
        email: string;
        name: string | null;
        imageUrl: string | null;
        balances: { game: string; balance: number }[];
    }>();

    for (const player of allPlayers) {
        const existing = userMap.get(player.email);
        if (existing) {
            existing.balances.push({ game: player.game, balance: player.balance });
            // Use the most descriptive name/image
            if (!existing.name && player.displayName) existing.name = player.displayName;
            if (!existing.imageUrl && player.imageUrl) existing.imageUrl = player.imageUrl;
        } else {
            userMap.set(player.email, {
                email: player.email,
                name: player.displayName || player.username,
                imageUrl: player.imageUrl,
                balances: [{ game: player.game, balance: player.balance }],
            });
        }
    }

    console.log(`👤 Unique users (by email): ${userMap.size}`);

    // Show users that exist in multiple games
    let multiGameUsers = 0;
    for (const [email, user] of userMap) {
        if (user.balances.length > 1) {
            multiGameUsers++;
            const balanceStr = user.balances.map(b => `${b.game}: ${b.balance}`).join(", ");
            console.log(`   🎮 ${email} plays ${user.balances.length} games (${balanceStr})`);
        }
    }
    console.log(`   ${multiGameUsers} users play multiple games\n`);

    // 3. Write to central wallet DB
    console.log("✍️  Writing to central wallet DB...");
    const walletPool = new pg.Pool({ connectionString: WALLET_DB_URL, max: 3 });

    try {
        // Clear existing data (safe — this is a fresh DB)
        await walletPool.query('DELETE FROM "CentralTransaction"');
        await walletPool.query('DELETE FROM "CentralWallet"');
        await walletPool.query('DELETE FROM "CentralUser"');

        let usersCreated = 0;
        let txCreated = 0;

        for (const [email, userData] of userMap) {
            // Calculate combined balance from all games
            const totalBalance = userData.balances.reduce((sum, b) => sum + b.balance, 0);

            // Create CentralUser
            const userResult = await walletPool.query(
                `INSERT INTO "CentralUser" (id, email, name, "imageUrl", "createdAt", "updatedAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
                 RETURNING id`,
                [email, userData.name, userData.imageUrl]
            );
            const centralUserId = userResult.rows[0].id;

            // Create CentralWallet
            const walletResult = await walletPool.query(
                `INSERT INTO "CentralWallet" (id, balance, "userId", "createdAt", "updatedAt")
                 VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
                 RETURNING id`,
                [totalBalance, centralUserId]
            );
            const walletId = walletResult.rows[0].id;
            usersCreated++;

            // Copy all transactions for this user
            const userTxs = allTransactions
                .filter(tx => tx.email === email)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            let runningBalance = 0;
            for (const tx of userTxs) {
                const balanceBefore = runningBalance;
                if (tx.type === "CREDIT") {
                    runningBalance += tx.amount;
                } else {
                    runningBalance -= tx.amount;
                }
                const balanceAfter = runningBalance;

                // Map description to reason
                const reason = mapReason(tx.description);

                await walletPool.query(
                    `INSERT INTO "CentralTransaction" 
                     (id, amount, type, reason, description, game, "balanceBefore", "balanceAfter", "walletId", "createdAt")
                     VALUES (gen_random_uuid(), $1, $2, $3::\"TransactionReason\", $4, $5, $6, $7, $8, $9)`,
                    [
                        Math.abs(tx.amount),
                        tx.type,
                        reason,
                        tx.description,
                        tx.game,
                        balanceBefore,
                        balanceAfter,
                        walletId,
                        tx.createdAt,
                    ]
                );
                txCreated++;
            }
        }

        console.log(`✅ Created ${usersCreated} users with wallets`);
        console.log(`✅ Copied ${txCreated} transactions`);

        // 4. Verify balances
        console.log("\n🔍 Verifying balances...");
        const verifyResult = await walletPool.query(
            `SELECT cu.email, cw.balance 
             FROM "CentralWallet" cw 
             JOIN "CentralUser" cu ON cu.id = cw."userId"
             ORDER BY cw.balance DESC
             LIMIT 10`
        );
        console.log("   Top 10 balances:");
        for (const row of verifyResult.rows) {
            console.log(`   ${row.email}: ${row.balance} B-Coins`);
        }

    } finally {
        await walletPool.end();
    }

    console.log("\n🎉 Migration complete! No data was modified in any game database.");
}

// ─── Helper: map transaction description to reason enum ──────

function mapReason(description: string): string {
    const d = description.toLowerCase();
    if (d.includes("winner") || d.includes("prize") || d.includes("1st") || d.includes("2nd") || d.includes("3rd")) return "TOURNAMENT_WIN";
    if (d.includes("entry") || d.includes("joined")) return "TOURNAMENT_ENTRY";
    if (d.includes("royal pass") || d.includes("pass purchase")) return "ROYAL_PASS_PURCHASE";
    if (d.includes("top up") || d.includes("topup") || d.includes("razorpay") || d.includes("payment")) return "TOP_UP";
    if (d.includes("transfer") && d.includes("sent")) return "TRANSFER_SENT";
    if (d.includes("transfer") && d.includes("received")) return "TRANSFER_RECEIVED";
    if (d.includes("referral")) return "REFERRAL_BONUS";
    if (d.includes("streak")) return "STREAK_BONUS";
    if (d.includes("solo")) return "SOLO_SUPPORT";
    if (d.includes("admin") || d.includes("adjustment") || d.includes("manual")) return "ADMIN_ADJUSTMENT";
    return "OTHER";
}

// ─── Run ─────────────────────────────────────────────────────

migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
