/**
 * V1 Database Lookup Utility
 * 
 * Quick lookup tool for querying the V1 (PUBGMI) database.
 * 
 * Usage:
 *   node scripts/v1-lookup.js player <search>       - Find player by username/displayName
 *   node scripts/v1-lookup.js streak <search>        - Check player streak
 *   node scripts/v1-lookup.js wallet <search>        - Check player wallet/UC balance
 *   node scripts/v1-lookup.js matches <search>       - Show player match history
 *   node scripts/v1-lookup.js stats <search>         - Show player stats
 *   node scripts/v1-lookup.js all <search>           - Show everything
 *   node scripts/v1-lookup.js compare <search>       - Compare V1 vs V2 data
 *   node scripts/v1-lookup.js tables                 - List all V1 tables
 *   node scripts/v1-lookup.js schema <table>         - Show table columns
 *   node scripts/v1-lookup.js sql "<query>"          - Run raw SQL on V1
 */

const { Client } = require('pg');

// ─── Database connections ──────────────────────────────────────
const V1_DB = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const V2_DB = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

/**
 * V1 Schema Reference:
 * 
 * User table: id, email, clerkId, userName, displayName, role, balance, 
 *             playerId, isOnboarded, imageUrl, referralCode, dateOfBirth,
 *             isPromoter, promoterEarnings, displayNameLastChangeAt, usernameLastChangeAt
 * 
 * Player table: id, userId, isBanned, category, isUCExempt, isTrusted,
 *               isSoloRestricted, meritScore, soloMatchesNeeded,
 *               tournamentStreak, streakSeasonId, lastStreakRewardAt, lastTournamentSeqId,
 *               pendingStreakReward, pendingWinnerDetails, pendingWinnerPosition,
 *               pendingWinnerReward, pendingWinnerTournament, pendingReferralBonus,
 *               pendingReferralMsg, pendingSoloSupport, pendingSoloSupportMsg, bio
 * 
 * Match, Team, Season, Transaction, TeamStats, TeamPlayerStats, PlayerStats
 * UC (wallet equivalent): id, balance, playerId
 */

async function connect(dbUrl) {
    const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });
    await client.connect();
    return client;
}

async function findPlayer(v1, search) {
    const result = await v1.query(`
        SELECT u.id as "userId", u."userName", u."displayName", u.email, u.role, u.balance,
               p.id as "playerId", p.category, p."isBanned", p."isUCExempt", p."isTrusted",
               p."meritScore", p.bio
        FROM "User" u
        LEFT JOIN "Player" p ON p."userId" = u.id
        WHERE u."userName" ILIKE $1 OR u."displayName" ILIKE $1 OR u.email ILIKE $1
    `, [`%${search}%`]);
    return result.rows;
}

async function getStreak(v1, playerId) {
    const result = await v1.query(`
        SELECT "tournamentStreak", "streakSeasonId", "lastStreakRewardAt", 
               "lastTournamentSeqId", "pendingStreakReward"
        FROM "Player" WHERE id = $1
    `, [playerId]);
    return result.rows[0];
}

async function getWallet(v1, search) {
    const result = await v1.query(`
        SELECT u."userName", u."displayName", u.balance as "userBalance",
               uc.balance as "ucBalance", uc.id as "ucId"
        FROM "User" u
        LEFT JOIN "UC" uc ON uc."playerId" = (SELECT id FROM "Player" WHERE "userId" = u.id LIMIT 1)
        WHERE u."userName" ILIKE $1 OR u."displayName" ILIKE $1
    `, [`%${search}%`]);
    return result.rows;
}

async function getMatches(v1, playerId) {
    const result = await v1.query(`
        SELECT m.id, m."matchNumber", m."sequenceId", m."createdAt",
               t."teamName", ts.placement, ts."totalKills"
        FROM "Match" m
        JOIN "_MatchToPlayer" mp ON mp."B" = m.id
        LEFT JOIN "_MatchToTeam" mt ON mt."B" = m.id
        LEFT JOIN "Team" t ON t.id = mt."A"
        LEFT JOIN "TeamStats" ts ON ts."matchId" = m.id AND ts."teamId" = t.id
        LEFT JOIN "_PlayerToTeam" pt ON pt."A" = $1 AND pt."B" = t.id
        WHERE mp."A" = $1
        ORDER BY m."createdAt" DESC
        LIMIT 20
    `, [playerId]);
    return result.rows;
}

async function getStats(v1, playerId) {
    const result = await v1.query(`
        SELECT ps.*, s.name as "seasonName"
        FROM "PlayerStats" ps
        LEFT JOIN "Season" s ON s.id = ps."seasonId"
        WHERE ps."playerId" = $1
    `, [playerId]);
    return result.rows;
}

async function listTables(v1) {
    const result = await v1.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as col_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    return result.rows;
}

async function getSchema(v1, tableName) {
    const result = await v1.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
}

async function comparePlayer(v1, v2, search) {
    const v1Players = await findPlayer(v1, search);
    if (v1Players.length === 0) {
        console.log('Player not found in V1');
        return;
    }

    const v1p = v1Players[0];
    console.log('\n=== V1 Player ===');
    console.log(JSON.stringify(v1p, null, 2));

    // Find in V2 by matching
    const v2Result = await v2.query(`
        SELECT p.id, p.username, p."displayName", p."inGameName", p.email,
               p.role, p."walletBalance", p.category, p."isBanned", p."meritScore"
        FROM "Player" p
        WHERE p.username ILIKE $1 OR p."displayName" ILIKE $1 OR p.email ILIKE $1
    `, [`%${search}%`]);

    if (v2Result.rows.length > 0) {
        console.log('\n=== V2 Player ===');
        console.log(JSON.stringify(v2Result.rows[0], null, 2));
    } else {
        console.log('\n⚠️ Player NOT found in V2');
    }
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
    const [, , command, ...args] = process.argv;
    const search = args.join(' ');

    if (!command) {
        console.log('Usage: node scripts/v1-lookup.js <command> <search>');
        console.log('Commands: player, streak, wallet, matches, stats, all, compare, tables, schema, sql');
        return;
    }

    const v1 = await connect(V1_DB);
    let v2 = null;

    try {
        switch (command) {
            case 'player': {
                const players = await findPlayer(v1, search);
                console.log(`Found ${players.length} player(s):`);
                players.forEach(p => console.log(JSON.stringify(p, null, 2)));
                break;
            }
            case 'streak': {
                const players = await findPlayer(v1, search);
                if (players.length === 0) { console.log('Not found'); break; }
                console.log(`${players[0].userName} (${players[0].displayName}):`);
                const streak = await getStreak(v1, players[0].playerId);
                console.log(JSON.stringify(streak, null, 2));
                break;
            }
            case 'wallet': {
                const wallets = await getWallet(v1, search);
                wallets.forEach(w => console.log(JSON.stringify(w, null, 2)));
                break;
            }
            case 'matches': {
                const players = await findPlayer(v1, search);
                if (players.length === 0) { console.log('Not found'); break; }
                const matches = await getMatches(v1, players[0].playerId);
                console.log(`Last ${matches.length} matches for ${players[0].userName}:`);
                matches.forEach(m => console.log(JSON.stringify(m)));
                break;
            }
            case 'stats': {
                const players = await findPlayer(v1, search);
                if (players.length === 0) { console.log('Not found'); break; }
                const stats = await getStats(v1, players[0].playerId);
                stats.forEach(s => console.log(JSON.stringify(s, null, 2)));
                break;
            }
            case 'all': {
                const players = await findPlayer(v1, search);
                if (players.length === 0) { console.log('Not found'); break; }
                const p = players[0];
                console.log('=== Player ===');
                console.log(JSON.stringify(p, null, 2));
                console.log('\n=== Streak ===');
                console.log(JSON.stringify(await getStreak(v1, p.playerId), null, 2));
                console.log('\n=== Wallet ===');
                const wallets = await getWallet(v1, search);
                wallets.forEach(w => console.log(JSON.stringify(w, null, 2)));
                console.log('\n=== Stats ===');
                const stats = await getStats(v1, p.playerId);
                stats.forEach(s => console.log(JSON.stringify(s, null, 2)));
                break;
            }
            case 'compare': {
                v2 = await connect(V2_DB);
                await comparePlayer(v1, v2, search);
                break;
            }
            case 'tables': {
                const tables = await listTables(v1);
                console.log('V1 Tables:');
                tables.forEach(t => console.log(`  ${t.table_name} (${t.col_count} cols)`));
                break;
            }
            case 'schema': {
                const schema = await getSchema(v1, search);
                console.log(`Schema for "${search}":`);
                schema.forEach(c => console.log(`  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} ${c.is_nullable === 'YES' ? 'nullable' : 'required'}`));
                break;
            }
            case 'sql': {
                const result = await v1.query(search);
                console.log(`Rows: ${result.rows.length}`);
                result.rows.forEach(r => console.log(JSON.stringify(r)));
                break;
            }
            default:
                console.log('Unknown command:', command);
        }
    } finally {
        await v1.end();
        if (v2) await v2.end();
    }
}

main().catch(console.error);
