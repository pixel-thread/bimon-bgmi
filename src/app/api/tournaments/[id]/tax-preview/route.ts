import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { getTaxRate } from "@/lib/logic/repeatWinnerTax";
import { getSoloTaxRate } from "@/lib/logic/soloTax";
import { getTierInfo } from "@/lib/logic/prizeDistribution";

/**
 * GET /api/tournaments/[id]/tax-preview?playerIds=id1,id2,...
 *
 * Returns tax preview data for winning players:
 * - Previous wins + tax rate (repeat winner tax)
 * - Solo status + solo tax rate
 * - Match participation rate
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const playerIdsParam = req.nextUrl.searchParams.get("playerIds");
        if (!playerIdsParam) {
            return NextResponse.json({ error: "playerIds required" }, { status: 400 });
        }

        const playerIds = playerIdsParam.split(",").filter(Boolean);
        if (playerIds.length === 0) {
            return NextResponse.json({ data: {} });
        }

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: { id: true, seasonId: true, fee: true },
        });
        if (!tournament) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Step 1: Get match IDs for this tournament
        const matchIds = (await prisma.match.findMany({
            where: { tournamentId: id },
            select: { id: true },
        })).map(m => m.id);

        const totalMatches = matchIds.length;
        console.log("[tax-preview v3] matchIds:", matchIds.length, "playerIds:", playerIds.length);

        // Step 2: Parallel fetch using flat matchId filter (works for migrated data)
        const [recentWins, playerMatchCounts, teamPlayerData] = await Promise.all([
            getPlayerRecentWins(playerIds, tournament.seasonId || "", 6),
            // Count matches per player using flat matchId filter (no nested relation)
            prisma.teamPlayerStats.groupBy({
                by: ["playerId"],
                where: {
                    playerId: { in: playerIds },
                    matchId: { in: matchIds },
                },
                _count: { matchId: true },
            }),
            // Get team composition via teamPlayerStats
            prisma.teamPlayerStats.findMany({
                where: {
                    playerId: { in: playerIds },
                    matchId: { in: matchIds },
                },
                select: {
                    playerId: true,
                    teamId: true,
                },
                distinct: ["playerId", "teamId"],
            }),
        ]);

        // Build maps
        const matchesPlayedMap = new Map<string, number>();
        for (const r of playerMatchCounts) matchesPlayedMap.set(r.playerId, r._count.matchId);

        // Detect solo players: count unique players per team from teamPlayerStats
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

        // Build result
        const result: Record<string, {
            previousWins: number;
            totalWins: number;
            taxRate: number;
            taxPercentage: string;
            repeatWinnerTaxRate: number;
            soloTaxRate: number;
            isSolo: boolean;
            matchesPlayed: number;
            totalMatches: number;
            participationRate: number;
        }> = {};

        for (const pid of playerIds) {
            const previousWins = recentWins.get(pid) || 0;
            const totalWins = previousWins + 1; // including this potential win
            const repeatRate = getTaxRate(totalWins);
            const isSolo = playerSoloMap.get(pid) || false;
            const soloRate = isSolo ? getSoloTaxRate() : 0;
            const combinedRate = 1 - ((1 - repeatRate) * (1 - soloRate));
            const matchesPlayed = matchesPlayedMap.get(pid) || 0;

            result[pid] = {
                previousWins,
                totalWins,
                taxRate: combinedRate,
                taxPercentage: `${Math.round(combinedRate * 100)}%`,
                repeatWinnerTaxRate: repeatRate,
                soloTaxRate: soloRate,
                isSolo,
                matchesPlayed,
                totalMatches,
                participationRate: totalMatches > 0 ? matchesPlayed / totalMatches : 1,
            };
        }

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error("Error fetching tax preview:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// Reuse the same logic from declare-winners
async function getPlayerRecentWins(
    playerIds: string[], seasonId: string, limit: number
): Promise<Map<string, number>> {
    if (!playerIds.length) return new Map();

    const where: { isWinnerDeclared: boolean; seasonId?: string } = { isWinnerDeclared: true };
    if (seasonId) where.seasonId = seasonId;

    const recent = await prisma.tournament.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            winners: {
                select: { teamId: true, position: true },
            },
        },
    });

    const counts = new Map<string, number>();
    for (const pid of playerIds) counts.set(pid, 0);

    // Collect all winning team IDs
    const winningTeamIds = new Set<string>();
    const teamTournamentMap = new Map<string, { fee: number; maxWinPos: number }>();

    for (const t of recent) {
        const pool = (t.fee || 50) * 16;
        const tier = getTierInfo(pool);
        const maxWinPos = tier.level === 1 ? tier.winnerCount : tier.winnerCount - 1;

        for (const w of t.winners) {
            if (w.position <= maxWinPos) {
                winningTeamIds.add(w.teamId);
                teamTournamentMap.set(w.teamId, { fee: t.fee || 0, maxWinPos });
            }
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
