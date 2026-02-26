import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import {
    getFinalDistribution,
    getTeamSize,
} from "@/lib/logic/prizeDistribution";
import {
    calculateRepeatWinnerTax,
    aggregateTaxTotals,
    type TaxResult,
} from "@/lib/logic/repeatWinnerTax";
import {
    calculateSoloTax,
    getTaxDistribution,
    calculateTierDistribution,
    getLoserSupportMessage,
    type SoloTaxResult,
} from "@/lib/logic/soloTax";



/**
 * POST /api/tournaments/[id]/declare-winners
 *
 * Full v1 parity — optimized for fewer DB roundtrips.
 *
 * Flow:
 * 1. Aggregate team rankings
 * 2. Per-player: participation adjustment → repeat winner tax → solo tax → final amount
 * 3. Create TournamentWinner + PendingReward (WINNER) records
 * 4. Solo tax distribution (loser support + bonus pool)
 * 5. Income records (Fund/Org with tax contributions)
 * 6. Merit reset for solo-restricted players
 * 7. Referral commission processing
 * 8. Mark tournament INACTIVE + isWinnerDeclared
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { placements, dryRun } = body as {
            placements?: { position: number; amount: number }[];
            dryRun?: boolean;
        };

        // ── 1. Fetch tournament ──────────────────────────────
        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: { id: true, name: true, fee: true, seasonId: true, isWinnerDeclared: true },
        });
        if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        if (!dryRun && tournament.isWinnerDeclared) return NextResponse.json({ error: "Winners already declared" }, { status: 400 });

        // ── 2. Aggregate team rankings ───────────────────────
        const teamStats = await prisma.teamStats.findMany({
            where: { tournamentId: id },
            include: {
                team: {
                    include: {
                        players: {
                            select: { id: true, userId: true, displayName: true, isUCExempt: true, isSoloRestricted: true, soloMatchesNeeded: true, meritScore: true },
                        },
                    },
                },
                teamPlayerStats: {
                    select: { kills: true },
                },
            },
        });

        // Aggregate per team
        type TeamAgg = {
            teamId: string;
            total: number; kills: number; pts: number;
            players: { playerId: string; userId: string; name: string; isUCExempt: boolean; isSoloRestricted: boolean; soloMatchesNeeded: number }[];
            chickenDinners: number;
            lastMatchPosition: number;
        };

        const teamMap = new Map<string, TeamAgg>();
        for (const stat of teamStats) {
            const kills = stat.teamPlayerStats.reduce((sum, ps) => sum + (ps.kills ?? 0), 0);
            const p = stat.position ?? 0;
            const t = kills + p;
            const existing = teamMap.get(stat.teamId);
            if (existing) {
                existing.kills += kills; existing.pts += p; existing.total += t;
                if (p === 1) existing.chickenDinners++;
                existing.lastMatchPosition = p; // latest stat overwrites
            } else {
                teamMap.set(stat.teamId, {
                    teamId: stat.teamId, total: t, kills, pts: p,
                    players: stat.team.players.map((p2) => ({
                        playerId: p2.id,
                        userId: p2.userId,
                        name: p2.displayName || "Unknown",
                        isUCExempt: p2.isUCExempt,
                        isSoloRestricted: p2.isSoloRestricted,
                        soloMatchesNeeded: p2.soloMatchesNeeded,
                    })),
                    chickenDinners: p === 1 ? 1 : 0,
                    lastMatchPosition: p,
                });
            }
        }

        // Sort with BGMI tiebreakers
        const rankings = Array.from(teamMap.values()).sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            if (b.chickenDinners !== a.chickenDinners) return b.chickenDinners - a.chickenDinners;
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.kills !== a.kills) return b.kills - a.kills;
            return a.lastMatchPosition - b.lastMatchPosition;
        });

        // Prize pool metadata
        const allPlayerIds = new Set<string>();
        let ucExemptCount = 0;
        for (const team of teamMap.values()) {
            for (const p of team.players) { allPlayerIds.add(p.playerId); if (p.isUCExempt) ucExemptCount++; }
        }

        const entryFee = tournament.fee ?? 0;
        const totalPlayers = allPlayerIds.size;
        const prizePool = entryFee * totalPlayers;
        const teamCount = teamMap.size;
        const teamSize = teamCount > 0 ? Math.round(totalPlayers / teamCount) : 2;

        const placementsToUse = placements && placements.length > 0
            ? placements
            : [{ position: 1, amount: 340 }, { position: 2, amount: 140 }];

        if (rankings.length < placementsToUse.length) {
            return NextResponse.json({ error: `Need ${placementsToUse.length} teams but only ${rankings.length} available.` }, { status: 400 });
        }

        // ── 3. Batch-fetch data needed for taxes ─────────────
        const allWinningPlayerIds: string[] = [];
        for (const pl of placementsToUse) {
            const team = rankings[pl.position - 1];
            if (team) for (const p of team.players) allWinningPlayerIds.push(p.playerId);
        }

        // Step 1: Get match IDs for this tournament
        const matchIds = (await prisma.match.findMany({
            where: { tournamentId: id },
            select: { id: true },
        })).map(m => m.id);

        const totalMatches = matchIds.length;

        // Step 2: Batch-fetch all tax data using flat matchId filter (works for migrated data)
        const [playerWinCounts, playerMatchCounts, teamPlayerData] = await Promise.all([
            getPlayerRecentWins(allWinningPlayerIds, tournament.seasonId || "", 6),
            prisma.teamPlayerStats.groupBy({
                by: ["playerId"],
                where: { playerId: { in: allWinningPlayerIds }, matchId: { in: matchIds } },
                _count: { matchId: true },
            }),
            // Detect solo via teamPlayerStats
            prisma.teamPlayerStats.findMany({
                where: {
                    playerId: { in: allWinningPlayerIds },
                    matchId: { in: matchIds },
                },
                select: { playerId: true, teamId: true },
                distinct: ["playerId", "teamId"],
            }),
        ]);

        const matchesPlayedMap = new Map<string, number>();
        for (const r of playerMatchCounts) matchesPlayedMap.set(r.playerId, r._count.matchId);

        // Detect solo: count unique players per team
        const teamPlayerCounts = new Map<string, Set<string>>();
        for (const tp of teamPlayerData) {
            if (!teamPlayerCounts.has(tp.teamId)) teamPlayerCounts.set(tp.teamId, new Set());
            teamPlayerCounts.get(tp.teamId)!.add(tp.playerId);
        }
        const playerSoloMap = new Map<string, boolean>();
        for (const tp of teamPlayerData) {
            const teamSize = teamPlayerCounts.get(tp.teamId)?.size ?? 0;
            playerSoloMap.set(tp.playerId, teamSize === 1);
        }

        // ── 4. Calculate per-player prizes ───────────────────
        const SOFTENING_FACTOR = 0.5;
        const allTaxResults: TaxResult[] = [];
        const allSoloTaxResults: SoloTaxResult[] = [];

        interface PlayerPrize {
            playerId: string;
            userId: string;
            finalAmount: number;
            message: string;
            details: Prisma.InputJsonValue;
            taxResult: TaxResult;
            soloTaxResult: SoloTaxResult;
        }

        interface WinnerTeamData {
            teamId: string;
            amount: number;
            position: number;
            players: PlayerPrize[];
        }

        const winnerTeamsData: WinnerTeamData[] = [];

        for (const placement of placementsToUse) {
            const team = rankings[placement.position - 1];
            if (!team) continue;

            const playersData: PlayerPrize[] = [];

            if (placement.amount > 0 && team.players.length > 0) {
                const basePerPlayer = Math.floor(placement.amount / team.players.length);

                // Participation adjustment
                const rates = team.players.map((p) => {
                    const played = matchesPlayedMap.get(p.playerId) || 0;
                    return { playerId: p.playerId, rate: totalMatches > 0 ? played / totalMatches : 1, played };
                });
                const avgRate = rates.reduce((s, r) => s + r.rate, 0) / team.players.length;

                const adjustedAmounts = new Map<string, { adjusted: number; adj: number; played: number }>();
                for (const r of rates) {
                    const adj = Math.floor((r.rate - avgRate) * basePerPlayer * SOFTENING_FACTOR);
                    adjustedAmounts.set(r.playerId, { adjusted: basePerPlayer + adj, adj, played: r.played });
                }

                for (const player of team.players) {
                    const pa = adjustedAmounts.get(player.playerId) || { adjusted: basePerPlayer, adj: 0, played: 0 };

                    // Repeat winner tax
                    const previousWins = playerWinCounts.get(player.playerId) || 0;
                    const taxResult = calculateRepeatWinnerTax(player.playerId, pa.adjusted, previousWins + 1);

                    // Solo tax
                    const isSolo = playerSoloMap.get(player.playerId) || false;
                    const soloTaxResult = calculateSoloTax(player.playerId, taxResult.netAmount, isSolo);

                    const finalAmount = soloTaxResult.netAmount;

                    playersData.push({
                        playerId: player.playerId,
                        userId: player.userId,
                        finalAmount,
                        message: `${getOrdinal(placement.position)} Place - ${tournament.name}`,
                        details: {
                            tournamentId: id,
                            tournamentName: tournament.name,
                            teamPrize: placement.amount,
                            playerCount: team.players.length,
                            baseShare: basePerPlayer,
                            participationAdj: pa.adj,
                            matchesPlayed: pa.played,
                            totalMatches,
                            repeatTax: taxResult.taxAmount,
                            soloTax: soloTaxResult.taxAmount,
                            wasRepeatWinner: taxResult.winCount > 1,
                            wasSolo: soloTaxResult.isSolo,
                        } as Prisma.InputJsonValue,
                        taxResult,
                        soloTaxResult,
                    });

                    allTaxResults.push(taxResult);
                    if (soloTaxResult.isSolo) allSoloTaxResults.push(soloTaxResult);
                }
            }

            winnerTeamsData.push({ teamId: team.teamId, amount: placement.amount, position: placement.position, players: playersData });
        }

        // ── 5. Calculate final amounts ────────────────────────
        let finalOrg = 0, finalFund = 0;
        if (prizePool > 0) {
            const distribution = getFinalDistribution(prizePool, entryFee, teamSize, ucExemptCount);
            const taxTotals = aggregateTaxTotals(allTaxResults);
            finalFund = distribution.finalFundAmount + taxTotals.fundContribution;
            finalOrg = distribution.finalOrgAmount + taxTotals.orgContribution;
            if (finalFund >= finalOrg && finalOrg > 0) {
                const combined = finalFund + finalOrg;
                finalOrg = Math.ceil(combined * 0.65);
                finalFund = combined - finalOrg;
            }
        }

        // ── DRY RUN: return preview without writing ──────────
        if (dryRun) {
            const dist = prizePool > 0 ? getFinalDistribution(prizePool, entryFee, teamSize, ucExemptCount) : null;
            const taxTots = aggregateTaxTotals(allTaxResults);
            return NextResponse.json({
                success: true,
                dryRun: true,
                data: {
                    finalOrg,
                    finalFund,
                    breakdown: {
                        orgBase: dist?.orgFee ?? 0,
                        fundBase: dist?.fundAmount ?? 0,
                        ucExemptCost: dist?.ucExemptCost ?? 0,
                        orgAfterExempt: dist?.finalOrgAmount ?? 0,
                        orgTaxContribution: taxTots.orgContribution,
                        fundTaxContribution: taxTots.fundContribution,
                        totalRepeatTax: taxTots.totalTax,
                    },
                    soloTaxTotal: allSoloTaxResults.reduce((s, r) => s + r.taxAmount, 0),
                    winners: winnerTeamsData.map(t => ({
                        position: t.position,
                        teamAmount: t.amount,
                        players: t.players.map(p => ({
                            playerId: p.playerId,
                            finalAmount: p.finalAmount,
                            repeatTax: p.taxResult.taxAmount,
                            soloTax: p.soloTaxResult.taxAmount,
                        })),
                    })),
                },
            });
        }

        // ── 6. Atomic transaction ────────────────────────────
        // Winners, PendingRewards, Income, and tournament status are ALL inside
        // the transaction so they can't get out of sync.
        const createdWinners = await prisma.$transaction(async (tx) => {
            const winners = [];

            for (const teamData of winnerTeamsData) {
                // Create TournamentWinner
                const winner = await tx.tournamentWinner.create({
                    data: {
                        amount: teamData.amount,
                        position: teamData.position,
                        team: { connect: { id: teamData.teamId } },
                        tournament: { connect: { id } },
                        isDistributed: true,
                    },
                });

                // Create PendingReward + Notification for each player
                for (const p of teamData.players) {
                    await tx.pendingReward.create({
                        data: {
                            playerId: p.playerId,
                            type: "WINNER",
                            amount: p.finalAmount,
                            position: teamData.position,
                            message: p.message,
                            details: p.details,
                        },
                    });

                    // Create notification so the player sees a badge + feed entry
                    await tx.notification.create({
                        data: {
                            userId: p.userId,
                            playerId: p.playerId,
                            title: `🏆 You won ${getOrdinal(teamData.position)} place!`,
                            message: `You earned ${p.finalAmount} UC in ${tournament.name}. Tap to claim your reward!`,
                            type: "tournament",
                            link: "/notifications",
                        },
                    });
                }

                winners.push(winner);
            }

            // Income records with tax contributions (INSIDE transaction)
            if (prizePool > 0) {
                if (finalFund > 0) {
                    const taxTotals = aggregateTaxTotals(allTaxResults);
                    await tx.income.create({
                        data: {
                            amount: finalFund,
                            description: taxTotals.fundContribution > 0
                                ? `Fund - ${tournament.name} (incl. ₹${taxTotals.fundContribution} repeat winner tax)`
                                : `Fund - ${tournament.name}`,
                            tournamentId: id, tournamentName: tournament.name, createdBy: "system",
                        },
                    });
                }
                if (finalOrg > 0) {
                    const taxTotals = aggregateTaxTotals(allTaxResults);
                    await tx.income.create({
                        data: {
                            amount: finalOrg,
                            description: taxTotals.orgContribution > 0
                                ? `Org - ${tournament.name} (incl. ₹${taxTotals.orgContribution} repeat winner tax)`
                                : `Org - ${tournament.name}`,
                            tournamentId: id, tournamentName: tournament.name, createdBy: "system",
                        },
                    });
                }
            }

            // Mark tournament completed (INSIDE transaction)
            await tx.tournament.update({
                where: { id },
                data: { isWinnerDeclared: true, status: "INACTIVE" },
            });

            return winners;
        }, { timeout: 30000, maxWait: 35000 });

        // ── 6. Post-transaction: Solo tax distribution ────────
        // (Outside transaction — needs winners committed first for loser calc)

        // Solo tax distribution
        const totalSoloTax = allSoloTaxResults.reduce((s, r) => s + r.taxAmount, 0);
        if (totalSoloTax > 0 && tournament.seasonId) {
            const taxDist = getTaxDistribution(totalSoloTax);

            // Get loser tiers
            const loserTiers = await getPlayerLosses(tournament.seasonId);

            // Get solo winner display names
            const soloWinnerNames = await prisma.player.findMany({
                where: { id: { in: allSoloTaxResults.map((r) => r.playerId) } },
                select: { displayName: true },
            });
            const donorName = soloWinnerNames.map((p) => p.displayName || "Unknown").join(", ");

            if (taxDist.loserAmount > 0 && loserTiers.length > 0) {
                const tierDistribution = calculateTierDistribution(taxDist.loserAmount, loserTiers);

                // Distribute to losers via PendingReward
                const loserRewardOps = [];
                for (const tier of tierDistribution) {
                    if (tier.perPlayer > 0) {
                        for (const loserId of tier.playerIds) {
                            loserRewardOps.push(prisma.pendingReward.create({
                                data: {
                                    playerId: loserId,
                                    type: "SOLO_SUPPORT",
                                    amount: tier.perPlayer,
                                    message: getLoserSupportMessage(donorName, tournament.name),
                                },
                            }));
                        }
                    }
                }
                await Promise.all(loserRewardOps);

                // 40% to bonus pool
                if (taxDist.poolAmount > 0) {
                    await addToSoloTaxPool(tournament.seasonId, taxDist.poolAmount, donorName);
                }
            } else {
                // No losers — 100% to pool
                await addToSoloTaxPool(tournament.seasonId, totalSoloTax, donorName);
            }

            // Consume pool (was already factored into client-side prize display)
            await consumeSoloTaxPool(tournament.seasonId);
        }

        // NOTE: Merit reset + referral commissions are now handled
        // by the separate "Process Rewards" button (/api/tournaments/[id]/post-declare)
        // to keep the declare-winners flow fast.

        return NextResponse.json({
            success: true,
            message: "Winners declared and rewards created",
            data: createdWinners,
        });
    } catch (error) {
        console.error("Error declaring winners:", error);
        return NextResponse.json({ error: "Failed to declare winners" }, { status: 500 });
    }
}

// ── Helper functions (inlined from v1 services, optimized) ──

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Count recent wins per player in last N season tournaments */
async function getPlayerRecentWins(
    playerIds: string[], seasonId: string, limit: number,
    excludeTournamentId?: string
): Promise<Map<string, number>> {
    if (!playerIds.length) return new Map();

    const where: { isWinnerDeclared: boolean; seasonId?: string; id?: { not: string } } = { isWinnerDeclared: true };
    if (seasonId) where.seasonId = seasonId;
    if (excludeTournamentId) where.id = { not: excludeTournamentId };

    const recent = await prisma.tournament.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            winners: {
                select: { teamId: true },
            },
        },
    });

    const counts = new Map<string, number>();
    for (const pid of playerIds) counts.set(pid, 0);

    // Collect ALL winning team IDs (any position that received UC counts)
    const winningTeamIds = new Set<string>();
    for (const t of recent) {
        for (const w of t.winners) {
            winningTeamIds.add(w.teamId);
        }
    }

    if (winningTeamIds.size === 0) return counts;

    // Find which players were on winning teams via TeamPlayerStats
    const winningPlayerStats = await prisma.teamPlayerStats.findMany({
        where: {
            teamId: { in: Array.from(winningTeamIds) },
            playerId: { in: playerIds },
        },
        select: { playerId: true, teamId: true },
        distinct: ["playerId", "teamId"],
    });

    // Count distinct winning teams per player
    const playerTeams = new Map<string, Set<string>>();
    for (const ps of winningPlayerStats) {
        if (!playerTeams.has(ps.playerId)) playerTeams.set(ps.playerId, new Set());
        playerTeams.get(ps.playerId)!.add(ps.teamId);
    }

    for (const [pid, teams] of playerTeams) {
        counts.set(pid, teams.size);
    }

    return counts;
}

/** Get top 3 loser tiers for a season */
async function getPlayerLosses(seasonId: string): Promise<{ lossAmount: number; playerIds: string[] }[]> {
    if (!seasonId) return [];

    const tournaments = await prisma.tournament.findMany({
        where: { seasonId },
        select: { id: true, name: true },
    });
    if (tournaments.length === 0) return [];

    const teams = await prisma.team.findMany({
        where: { tournamentId: { in: tournaments.map((t) => t.id) } },
        include: {
            players: {
                include: { transactions: true },
            },
        },
    });

    const playerLosses = new Map<string, number>();
    const tNames = tournaments.map((t) => t.name);

    for (const team of teams) {
        for (const player of team.players) {
            if (playerLosses.has(player.id)) continue;
            let fees = 0, prizes = 0;
            for (const tx of player.transactions) {
                const isSeasonTx = tNames.some((n) => tx.description.includes(n));
                if (!isSeasonTx) continue;
                if (tx.type === "DEBIT" && tx.description.toLowerCase().includes("entry")) fees += tx.amount;
                else if (tx.type === "CREDIT" && tx.description.toLowerCase().includes("prize")) prizes += tx.amount;
            }
            const loss = fees - prizes;
            if (loss > 0) playerLosses.set(player.id, loss);
        }
    }

    // Group by loss amount, sort desc, top 3
    const groups = new Map<number, string[]>();
    for (const [pid, loss] of playerLosses) {
        const existing = groups.get(loss) || [];
        existing.push(pid);
        groups.set(loss, existing);
    }

    return Array.from(groups.entries())
        .sort((a, b) => b[0] - a[0])
        .slice(0, 3)
        .map(([lossAmount, playerIds]) => ({ lossAmount, playerIds }));
}

/** Add to solo tax bonus pool */
async function addToSoloTaxPool(seasonId: string, amount: number, donorName?: string) {
    const existing = await prisma.soloTaxPool.findFirst({ where: { seasonId } });
    if (existing) {
        let name = existing.donorName;
        if (donorName && (!name || !name.includes(donorName))) {
            name = name ? `${name}, ${donorName}` : donorName;
        }
        await prisma.soloTaxPool.update({
            where: { id: existing.id },
            data: { amount: { increment: amount }, donorName: name },
        });
    } else {
        await prisma.soloTaxPool.create({ data: { seasonId, amount, donorName: donorName || null } });
    }
}

/** Consume the solo tax pool (reset to 0) */
async function consumeSoloTaxPool(seasonId: string) {
    const pool = await prisma.soloTaxPool.findFirst({ where: { seasonId } });
    if (pool && pool.amount > 0) {
        await prisma.soloTaxPool.update({ where: { id: pool.id }, data: { amount: 0, donorName: null } });
    }
}
