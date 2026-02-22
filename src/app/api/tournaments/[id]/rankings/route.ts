import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

// BGMI placement points — must match standings-modal.tsx
const PLACEMENT_PTS: Record<number, number> = {
    1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
};

/**
 * GET /api/tournaments/[id]/rankings
 * Fetch team rankings for a tournament (admin only).
 * Uses teamPlayerStats for player rosters (works for both migrated & new data).
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                fee: true,
                isWinnerDeclared: true,
            },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Fetch team stats — use teamPlayerStats for player info (reliable for migrated data)
        const teamStats = await prisma.teamStats.findMany({
            where: { tournamentId: id },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        // Try team.players (works for v2-created teams)
                        players: {
                            select: {
                                id: true,
                                displayName: true,
                                user: { select: { username: true } },
                            },
                        },
                    },
                },
                teamPlayerStats: {
                    select: {
                        playerId: true,
                        kills: true,
                        player: {
                            select: {
                                id: true,
                                displayName: true,
                                user: { select: { username: true } },
                            },
                        },
                    },
                },
            },
        });

        // Aggregate stats per team
        const teamMap = new Map<string, {
            teamId: string;
            name: string;
            total: number;
            kills: number;
            pts: number;
            players: { id: string; name: string }[];
        }>();

        // Track all unique players across all teams for prize pool
        const allPlayerIds = new Set<string>();

        for (const stat of teamStats) {
            const kills = stat.teamPlayerStats.reduce((sum, ps) => sum + ps.kills, 0);
            const pts = PLACEMENT_PTS[stat.position] ?? 0;
            const total = kills + pts;

            const existing = teamMap.get(stat.teamId);
            if (existing) {
                existing.kills += kills;
                existing.pts += pts;
                existing.total += total;

                // Add any new players from this match's teamPlayerStats
                for (const ps of stat.teamPlayerStats) {
                    allPlayerIds.add(ps.playerId);
                    if (!existing.players.some(p => p.id === ps.playerId)) {
                        existing.players.push({
                            id: ps.player.id,
                            name: ps.player.displayName || ps.player.user?.username || "Unknown",
                        });
                    }
                }
            } else {
                // Build player list: prefer team.players (v2 created), fallback to teamPlayerStats
                const playerMap = new Map<string, string>();

                // First add from team.players (complete roster if available)
                for (const p of stat.team.players) {
                    playerMap.set(p.id, p.displayName || p.user?.username || "Unknown");
                    allPlayerIds.add(p.id);
                }

                // Then add from teamPlayerStats (catches migrated data without team.players)
                for (const ps of stat.teamPlayerStats) {
                    if (!playerMap.has(ps.playerId)) {
                        playerMap.set(ps.player.id, ps.player.displayName || ps.player.user?.username || "Unknown");
                    }
                    allPlayerIds.add(ps.playerId);
                }

                const players = Array.from(playerMap.entries()).map(([pId, name]) => ({ id: pId, name }));

                teamMap.set(stat.teamId, {
                    teamId: stat.teamId,
                    name: stat.team.name,
                    total,
                    kills,
                    pts,
                    players,
                });
            }
        }

        // Sort by total points desc
        const rankings = Array.from(teamMap.values()).sort(
            (a, b) => b.total - a.total
        );

        // Determine team type from average team size
        const teamCount = teamMap.size;
        const avgTeamSize = teamCount > 0 ? Math.round(allPlayerIds.size / teamCount) : 2;

        return NextResponse.json({
            success: true,
            data: rankings,
            meta: {
                entryFee: tournament.fee ?? 0,
                totalPlayers: allPlayerIds.size,
                prizePool: (tournament.fee ?? 0) * allPlayerIds.size,
                teamType: avgTeamSize === 1 ? "SOLO" : avgTeamSize === 2 ? "DUO" : avgTeamSize === 3 ? "TRIO" : "SQUAD",
                isWinnerDeclared: tournament.isWinnerDeclared,
            },
        });
    } catch (error) {
        console.error("Error fetching rankings:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
