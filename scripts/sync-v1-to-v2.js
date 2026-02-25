/**
 * V1 → V2 Data Sync Script
 * 
 * Syncs missing data from V1 database to V2 database:
 * 1. 2 missing matches in "Lehkai sngewtynnad 11" (V1 match 201→5, 202→6)
 * 2. Associated TeamStats, TeamPlayerStats, MatchPlayerPlayed
 * 3. Fix wallet balances for 2 players (V1 has 100 more UC total)
 * 4. Join table entries (_MatchToTeam, _MatchToPlayer)
 * 
 * Usage:
 *   DRY RUN:  node scripts/sync-v1-to-v2.js
 *   EXECUTE:  node scripts/sync-v1-to-v2.js --execute
 */

const { Client } = require('pg');

// ─── Config ────────────────────────────────────────────────────
const V1_DB = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const V2_DB = "postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

// V1 Match IDs to migrate
const V1_MATCH_IDS = [
    '796aadc9-5f43-476e-a62c-6e2c457a83b4', // Match 201 → becomes Match 5
    '424afd6d-9cb9-4ace-bf16-1ca28c392933', // Match 202 → becomes Match 6
];

// Match number mapping: V1 match name → V2 matchNumber
const MATCH_NUMBER_MAP = {
    201: 5,
    202: 6,
};

// V1 Tournament T11 ID → V2 Tournament T11 ID
const V1_T11_ID = 'd45d6bc1-4c78-4870-a626-145ae23d1938';
const V2_T11_ID = 'e77357e5-4cbc-49e2-b038-02d7726b54a5';

// Wallet fixes: playerId → correct balance (from V1)
const WALLET_FIXES = [
    { playerId: '30b4798a-ff9f-4830-8bfd-73504d932d40', v1Balance: 30, v2Balance: 10 },
    { playerId: '9e0f480b-8e5a-47b3-8b6a-61ab7555461b', v1Balance: 60, v2Balance: -40 },
];

const DRY_RUN = !process.argv.includes('--execute');

// ─── Helpers ───────────────────────────────────────────────────

function log(msg) {
    console.log(`${DRY_RUN ? '[DRY RUN]' : '[EXECUTE]'} ${msg}`);
}

function logSection(title) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'═'.repeat(60)}`);
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
    console.log(`\n🔄 V1 → V2 Data Sync Script`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚡ EXECUTE (changes WILL be applied)'}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    const v1 = new Client({ connectionString: V1_DB, connectionTimeoutMillis: 10000 });
    const v2 = new Client({ connectionString: V2_DB, connectionTimeoutMillis: 10000 });

    try {
        log('Connecting to V1 database...');
        await v1.connect();
        log('✅ Connected to V1');

        log('Connecting to V2 database...');
        await v2.connect();
        log('✅ Connected to V2');

        // ── Step 0: Verify current state ──────────────────────────
        logSection('STEP 0: Verify Current State');
        await verifyState(v1, v2);

        // ── Step 1: Read missing match data from V1 ──────────────
        logSection('STEP 1: Read Missing Matches from V1');
        const matchData = await readV1Matches(v1);

        // ── Step 2: Resolve ID mappings ──────────────────────────
        logSection('STEP 2: Resolve ID Mappings');
        const mappings = await resolveIdMappings(v1, v2);

        // ── Step 3: Check for conflicts in V2 ────────────────────
        logSection('STEP 3: Check for Conflicts in V2');
        await checkConflicts(v2, matchData, mappings);

        // ── Step 4: Insert matches into V2 ───────────────────────
        logSection('STEP 4: Insert Matches into V2');
        await insertMatches(v2, matchData, mappings);

        // ── Step 5: Fix wallet balances ──────────────────────────
        logSection('STEP 5: Fix Wallet Balances');
        await fixWalletBalances(v2);

        // ── Step 6: Final verification ───────────────────────────
        logSection('STEP 6: Final Summary');
        await printSummary(v1, v2);

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        console.error(err.stack);
    } finally {
        await v1.end().catch(() => { });
        await v2.end().catch(() => { });
    }
}

// ─── Step 0: Verify State ──────────────────────────────────────

async function verifyState(v1, v2) {
    const v1Matches = await v1.query('SELECT COUNT(*)::int as count FROM "Match"');
    const v2Matches = await v2.query('SELECT COUNT(*)::int as count FROM "Match"');
    const v1T11Matches = await v1.query(
        'SELECT COUNT(*)::int as count FROM "Match" WHERE "tournamentId" = $1', [V1_T11_ID]
    );
    const v2T11Matches = await v2.query(
        'SELECT COUNT(*)::int as count FROM "Match" WHERE "tournamentId" = $1', [V2_T11_ID]
    );

    log(`V1 total matches: ${v1Matches.rows[0].count}`);
    log(`V2 total matches: ${v2Matches.rows[0].count}`);
    log(`V1 T11 matches: ${v1T11Matches.rows[0].count}`);
    log(`V2 T11 matches: ${v2T11Matches.rows[0].count}`);
    log(`Expected: V1 has ${v1Matches.rows[0].count - v2Matches.rows[0].count} more matches`);

    // Verify wallet state
    const v1UC = await v1.query('SELECT SUM(balance)::bigint as total FROM "UC"');
    const v2UC = await v2.query('SELECT SUM(balance)::bigint as total FROM "Wallet"');
    log(`V1 total UC: ${v1UC.rows[0].total}`);
    log(`V2 total wallet: ${v2UC.rows[0].total}`);
    log(`UC difference: ${v1UC.rows[0].total - v2UC.rows[0].total}`);
}

// ─── Step 1: Read V1 Matches ───────────────────────────────────

async function readV1Matches(v1) {
    const matches = [];

    for (const matchId of V1_MATCH_IDS) {
        log(`\nReading match ${matchId}...`);

        // Match record
        const matchRes = await v1.query(
            'SELECT * FROM "Match" WHERE id = $1', [matchId]
        );
        const match = matchRes.rows[0];
        if (!match) throw new Error(`Match ${matchId} not found in V1!`);
        log(`  Match name/number: ${match.name}, created: ${match.createdAt}`);

        // Teams linked to this match (_MatchToTeam)
        const teamsRes = await v1.query(
            'SELECT "B" as "teamId" FROM "_MatchToTeam" WHERE "A" = $1', [matchId]
        );
        log(`  Teams: ${teamsRes.rows.length}`);

        // Players linked to this match (_MatchToPlayer)
        const playersRes = await v1.query(
            'SELECT "B" as "playerId" FROM "_MatchToPlayer" WHERE "A" = $1', [matchId]
        );
        log(`  Players: ${playersRes.rows.length}`);

        // TeamStats for this match
        const teamStatsRes = await v1.query(
            'SELECT * FROM "TeamStats" WHERE "matchId" = $1', [matchId]
        );
        log(`  TeamStats: ${teamStatsRes.rows.length}`);

        // TeamPlayerStats for this match
        const tpsRes = await v1.query(
            'SELECT * FROM "TeamPlayerStats" WHERE "matchId" = $1', [matchId]
        );
        log(`  TeamPlayerStats: ${tpsRes.rows.length}`);

        // MatchPlayerPlayed for this match
        const mppRes = await v1.query(
            'SELECT * FROM "MatchPlayerPlayed" WHERE "matchId" = $1', [matchId]
        );
        log(`  MatchPlayerPlayed: ${mppRes.rows.length}`);

        // PlayerStats linked to this match (_MatchToPlayerStats)
        const psRes = await v1.query(
            'SELECT "B" as "playerStatsId" FROM "_MatchToPlayerStats" WHERE "A" = $1', [matchId]
        );
        log(`  PlayerStats links: ${psRes.rows.length}`);

        matches.push({
            match,
            teams: teamsRes.rows,
            players: playersRes.rows,
            teamStats: teamStatsRes.rows,
            teamPlayerStats: tpsRes.rows,
            matchPlayerPlayed: mppRes.rows,
            playerStatsLinks: psRes.rows,
        });
    }

    return matches;
}

// ─── Step 2: Resolve ID Mappings ───────────────────────────────

async function resolveIdMappings(v1, v2) {
    // Get the season IDs
    const v1Season = await v1.query(
        `SELECT s.id FROM "Season" s 
     JOIN "Tournament" t ON t."seasonId" = s.id 
     WHERE t.id = $1`, [V1_T11_ID]
    );
    const v2Season = await v2.query(
        `SELECT s.id FROM "Season" s 
     JOIN "Tournament" t ON t."seasonId" = s.id 
     WHERE t.id = $1`, [V2_T11_ID]
    );

    const v1SeasonId = v1Season.rows[0]?.id;
    const v2SeasonId = v2Season.rows[0]?.id;

    log(`V1 Season ID for T11: ${v1SeasonId}`);
    log(`V2 Season ID for T11: ${v2SeasonId}`);

    // Verify teams exist in V2 - get all teams for T11 from V1
    const v1Teams = await v1.query(
        'SELECT id, name, "teamNumber" FROM "Team" WHERE "tournamentId" = $1 ORDER BY "teamNumber"',
        [V1_T11_ID]
    );
    const v2Teams = await v2.query(
        'SELECT id, name, "teamNumber" FROM "Team" WHERE "tournamentId" = $1 ORDER BY "teamNumber"',
        [V2_T11_ID]
    );

    log(`V1 T11 teams: ${v1Teams.rows.length}`);
    log(`V2 T11 teams: ${v2Teams.rows.length}`);

    // Build team mapping (V1 team ID → V2 team ID) based on teamNumber
    const teamMap = {};
    for (const v1Team of v1Teams.rows) {
        const v2Team = v2Teams.rows.find(t => t.teamNumber === v1Team.teamNumber);
        if (v2Team) {
            teamMap[v1Team.id] = v2Team.id;
        } else {
            log(`  ⚠️ V1 team ${v1Team.name} (#{v1Team.teamNumber}) has no V2 match!`);
        }
    }
    log(`Team mappings resolved: ${Object.keys(teamMap).length}`);

    // Also log a few mappings for verification
    const sampleEntries = Object.entries(teamMap).slice(0, 3);
    for (const [v1Id, v2Id] of sampleEntries) {
        const v1Name = v1Teams.rows.find(t => t.id === v1Id)?.name;
        const v2Name = v2Teams.rows.find(t => t.id === v2Id)?.name;
        log(`  Sample: "${v1Name}" (${v1Id.slice(0, 8)}) → "${v2Name}" (${v2Id.slice(0, 8)})`);
    }

    return {
        tournamentId: { v1: V1_T11_ID, v2: V2_T11_ID },
        seasonId: { v1: v1SeasonId, v2: v2SeasonId },
        teamMap,
    };
}

// ─── Step 3: Check Conflicts ───────────────────────────────────

async function checkConflicts(v2, matchData, mappings) {
    for (const md of matchData) {
        const v2MatchNumber = MATCH_NUMBER_MAP[md.match.name];

        // Check if match number already exists in V2 for this tournament
        const existing = await v2.query(
            'SELECT id FROM "Match" WHERE "tournamentId" = $1 AND "matchNumber" = $2',
            [mappings.tournamentId.v2, v2MatchNumber]
        );

        if (existing.rows.length > 0) {
            log(`⚠️ Match ${v2MatchNumber} already exists in V2 T11! ID: ${existing.rows[0].id}`);
            log(`   Skipping this match to avoid duplicates.`);
            md.skip = true;
        } else {
            log(`✅ Match ${v2MatchNumber} doesn't exist in V2 T11 — safe to insert`);
        }

        // Check if teams from this match exist in V2
        let missingTeams = 0;
        for (const t of md.teams) {
            const v2TeamId = mappings.teamMap[t.teamId];
            if (!v2TeamId) {
                log(`  ⚠️ Team ${t.teamId} from V1 has no mapping in V2!`);
                missingTeams++;
            }
        }
        if (missingTeams === 0) {
            log(`✅ All ${md.teams.length} teams have V2 mappings`);
        }
    }
}

// ─── Step 4: Insert Matches ────────────────────────────────────

async function insertMatches(v2, matchData, mappings) {
    for (const md of matchData) {
        if (md.skip) {
            log(`⏭ Skipping match ${md.match.name} (already exists)`);
            continue;
        }

        const v2MatchNumber = MATCH_NUMBER_MAP[md.match.name];
        const newMatchId = md.match.id; // Keep same ID for simplicity

        log(`\n📝 Match ${md.match.name} → Match ${v2MatchNumber}`);
        log(`   ID: ${newMatchId}`);
        log(`   Created: ${md.match.createdAt}`);

        if (!DRY_RUN) {
            await v2.query('BEGIN');
            try {
                // 1. Insert Match
                await v2.query(
                    `INSERT INTO "Match" (id, "matchNumber", "tournamentId", "seasonId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
                    [newMatchId, v2MatchNumber, mappings.tournamentId.v2, mappings.seasonId.v2,
                        md.match.createdAt, md.match.updatedAt || new Date()]
                );
                log(`   ✅ Match inserted`);

                // 2. Insert _MatchToTeam join entries
                for (const t of md.teams) {
                    const v2TeamId = mappings.teamMap[t.teamId];
                    if (!v2TeamId) continue;
                    await v2.query(
                        'INSERT INTO "_MatchToTeam" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [newMatchId, v2TeamId]
                    );
                }
                log(`   ✅ ${md.teams.length} _MatchToTeam entries inserted`);

                // 3. Insert _MatchToPlayer join entries
                for (const p of md.players) {
                    await v2.query(
                        'INSERT INTO "_MatchToPlayer" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [newMatchId, p.playerId]
                    );
                }
                log(`   ✅ ${md.players.length} _MatchToPlayer entries inserted`);

                // 4. Insert TeamStats
                for (const ts of md.teamStats) {
                    const v2TeamId = mappings.teamMap[ts.teamId];
                    if (!v2TeamId) continue;
                    await v2.query(
                        `INSERT INTO "TeamStats" (id, "matchId", "teamId", position, "seasonId", "tournamentId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [ts.id, newMatchId, v2TeamId, ts.position, mappings.seasonId.v2,
                        mappings.tournamentId.v2, ts.createdAt, ts.updatedAt || new Date()]
                    );
                }
                log(`   ✅ ${md.teamStats.length} TeamStats inserted`);

                // 5. Insert TeamPlayerStats
                for (const tps of md.teamPlayerStats) {
                    const v2TeamId = mappings.teamMap[tps.teamId];
                    if (!v2TeamId) continue;
                    await v2.query(
                        `INSERT INTO "TeamPlayerStats" (id, "playerId", "teamId", "matchId", "teamStatsId", kills, present, "seasonId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [tps.id, tps.playerId, v2TeamId, newMatchId, tps.teamStatsId,
                        tps.kills, tps.deaths === 0 ? true : true, // V1 uses deaths, V2 uses present (always true if they have stats)
                        mappings.seasonId.v2, tps.createdAt, tps.updatedAt || new Date()]
                    );
                }
                log(`   ✅ ${md.teamPlayerStats.length} TeamPlayerStats inserted`);

                // 6. Insert MatchPlayerPlayed
                for (const mpp of md.matchPlayerPlayed) {
                    const v2TeamId = mappings.teamMap[mpp.teamId] || mpp.teamId;
                    await v2.query(
                        `INSERT INTO "MatchPlayerPlayed" (id, "matchId", "playerId", "tournamentId", "seasonId", "teamId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [mpp.id, newMatchId, mpp.playerId, mappings.tournamentId.v2,
                        mappings.seasonId.v2, v2TeamId, mpp.createdAt, mpp.updatedAt || new Date()]
                    );
                }
                log(`   ✅ ${md.matchPlayerPlayed.length} MatchPlayerPlayed inserted`);

                // 7. Update PlayerStats (aggregate kills, matches per player per season)
                // Get unique players from this match
                const playerIds = [...new Set(md.teamPlayerStats.map(tps => tps.playerId))];
                for (const playerId of playerIds) {
                    const playerKills = md.teamPlayerStats
                        .filter(tps => tps.playerId === playerId)
                        .reduce((sum, tps) => sum + tps.kills, 0);

                    // Upsert PlayerStats for this season
                    const kdValue = playerKills; // for a single match, kd = kills/1
                    await v2.query(
                        `INSERT INTO "PlayerStats" (id, "playerId", kills, matches, kd, "seasonId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2::int, 1, $3::float, $4, NOW(), NOW())
             ON CONFLICT ("seasonId", "playerId") 
             DO UPDATE SET 
               kills = "PlayerStats".kills + $2::int,
               matches = "PlayerStats".matches + 1,
               kd = CASE WHEN ("PlayerStats".matches + 1) > 0 
                    THEN ("PlayerStats".kills + $2::int)::float / ("PlayerStats".matches + 1) 
                    ELSE 0 END,
               "updatedAt" = NOW()`,
                        [playerId, playerKills, kdValue, mappings.seasonId.v2]
                    );
                }
                log(`   ✅ ${playerIds.length} PlayerStats updated`);

                // 8. Link PlayerStats to Match (_MatchToPlayerStats) and TeamStats (_PlayerStatsToTeamStats)
                for (const playerId of playerIds) {
                    const psRes = await v2.query(
                        'SELECT id FROM "PlayerStats" WHERE "playerId" = $1 AND "seasonId" = $2',
                        [playerId, mappings.seasonId.v2]
                    );
                    if (psRes.rows[0]) {
                        await v2.query(
                            'INSERT INTO "_MatchToPlayerStats" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [newMatchId, psRes.rows[0].id]
                        );
                    }
                }
                log(`   ✅ _MatchToPlayerStats links created`);

                await v2.query('COMMIT');
                log(`   ✅ COMMITTED match ${v2MatchNumber} transaction`);
            } catch (err) {
                await v2.query('ROLLBACK');
                log(`   ❌ ROLLED BACK match ${v2MatchNumber}: ${err.message}`);
                throw err;
            }
        } else {
            // Dry run — show what would be done
            log(`   Would insert Match (matchNumber=${v2MatchNumber})`);
            log(`   Would insert ${md.teams.length} _MatchToTeam entries`);
            log(`   Would insert ${md.players.length} _MatchToPlayer entries`);
            log(`   Would insert ${md.teamStats.length} TeamStats records`);
            log(`   Would insert ${md.teamPlayerStats.length} TeamPlayerStats records`);
            log(`   Would insert ${md.matchPlayerPlayed.length} MatchPlayerPlayed records`);

            // Show kills summary
            const killsByTeam = {};
            for (const tps of md.teamPlayerStats) {
                const teamId = tps.teamId;
                if (!killsByTeam[teamId]) killsByTeam[teamId] = { kills: 0, players: 0 };
                killsByTeam[teamId].kills += tps.kills;
                killsByTeam[teamId].players++;
            }
            log(`   Kill summary:`);
            const teamPositions = md.teamStats.sort((a, b) => a.position - b.position);
            for (const ts of teamPositions.slice(0, 5)) {
                const tk = killsByTeam[ts.teamId] || { kills: 0, players: 0 };
                log(`     Position ${ts.position}: Team ${ts.teamId.slice(0, 8)}... — ${tk.kills} kills (${tk.players} players)`);
            }
            if (teamPositions.length > 5) {
                log(`     ... and ${teamPositions.length - 5} more teams`);
            }
        }
    }
}

// ─── Step 5: Fix Wallet Balances ───────────────────────────────

async function fixWalletBalances(v2) {
    for (const fix of WALLET_FIXES) {
        log(`\nPlayer: ${fix.playerId}`);

        // Get current V2 balance
        const current = await v2.query(
            'SELECT balance FROM "Wallet" WHERE "playerId" = $1',
            [fix.playerId]
        );

        const currentBalance = current.rows[0]?.balance;
        const diff = fix.v1Balance - (currentBalance ?? fix.v2Balance);

        log(`  Current V2 balance: ${currentBalance}`);
        log(`  Target V1 balance: ${fix.v1Balance}`);
        log(`  Difference: ${diff > 0 ? '+' : ''}${diff}`);

        if (diff === 0) {
            log(`  ✅ Already in sync, no change needed`);
            continue;
        }

        if (!DRY_RUN) {
            // Update wallet balance
            await v2.query(
                'UPDATE "Wallet" SET balance = $1, "updatedAt" = NOW() WHERE "playerId" = $2',
                [fix.v1Balance, fix.playerId]
            );

            // Add a correction transaction for audit trail
            const txType = diff > 0 ? 'CREDIT' : 'DEBIT';
            await v2.query(
                `INSERT INTO "Transaction" (id, amount, type, description, "playerId", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
                [Math.abs(diff), txType, `V1→V2 sync: Balance correction (+${diff} UC)`, fix.playerId]
            );

            log(`  ✅ Updated balance to ${fix.v1Balance} and logged correction transaction`);
        } else {
            log(`  Would update balance: ${currentBalance} → ${fix.v1Balance} (${diff > 0 ? '+' : ''}${diff})`);
            log(`  Would add correction transaction: ${Math.abs(diff)} UC ${diff > 0 ? 'CREDIT' : 'DEBIT'}`);
        }
    }
}

// ─── Step 6: Summary ───────────────────────────────────────────

async function printSummary(v1, v2) {
    if (!DRY_RUN) {
        const v1Matches = await v1.query('SELECT COUNT(*)::int as count FROM "Match"');
        const v2Matches = await v2.query('SELECT COUNT(*)::int as count FROM "Match"');
        const v1UC = await v1.query('SELECT SUM(balance)::bigint as total FROM "UC"');
        const v2UC = await v2.query('SELECT SUM(balance)::bigint as total FROM "Wallet"');

        log(`\n📊 POST-MIGRATION STATE:`);
        log(`  V1 matches: ${v1Matches.rows[0].count}`);
        log(`  V2 matches: ${v2Matches.rows[0].count}`);
        log(`  Match diff: ${v1Matches.rows[0].count - v2Matches.rows[0].count} (should be 0)`);
        log(`  V1 UC: ${v1UC.rows[0].total}`);
        log(`  V2 UC: ${v2UC.rows[0].total}`);
        log(`  UC diff: ${v1UC.rows[0].total - v2UC.rows[0].total} (should be ~0)`);
    }

    console.log(`\n${'─'.repeat(60)}`);
    if (DRY_RUN) {
        console.log(`\n🔍 DRY RUN COMPLETE — No changes were made.`);
        console.log(`   To execute: node scripts/sync-v1-to-v2.js --execute\n`);
    } else {
        console.log(`\n✅ MIGRATION COMPLETE — All changes have been applied.\n`);
    }
}

// ─── Run ───────────────────────────────────────────────────────
main();
