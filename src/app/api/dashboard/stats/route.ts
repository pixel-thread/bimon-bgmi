import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * GET /api/dashboard/stats?seasonId=xxx
 * Fetches stats for the admin dashboard, optionally filtered by season.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        // Get seasonId from query params
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get("seasonId");

        // Season-scoped tournament filter
        const tournamentWhere = seasonId ? { seasonId } : {};

        const [
            totalUsers,
            activeTournaments,
            seasonTournaments,
            activePollCount,
            walletAgg,
            bannedCount,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.tournament.count({
                where: { status: "ACTIVE", ...tournamentWhere },
            }),
            prisma.tournament.count({ where: tournamentWhere }),
            prisma.poll.count({ where: { isActive: true } }),
            prisma.wallet.aggregate({ _sum: { balance: true } }),
            prisma.player.count({ where: { isBanned: true } }),
        ]);

        // Use TeamPlayerStats to count unique players per tournament (accurate source)
        const tournamentIds = (await prisma.tournament.findMany({
            where: tournamentWhere,
            select: { id: true },
        })).map(t => t.id);

        let avgPlayersPerTournament = 0;
        let seasonPlayerCount = 0;
        if (tournamentIds.length > 0) {
            // Get all player-team participations for this season
            const teamsWithTournament = await prisma.team.findMany({
                where: { tournamentId: { in: tournamentIds } },
                select: { id: true, tournamentId: true },
            });
            const teamToTournament = new Map(teamsWithTournament.map(t => [t.id, t.tournamentId]));

            const allTps = await prisma.teamPlayerStats.findMany({
                where: { team: { tournamentId: { in: tournamentIds } } },
                select: { playerId: true, teamId: true },
            });

            // Unique players across the entire season
            const seasonPlayers = new Set<string>();
            const perTournament = new Map<string, Set<string>>();

            for (const tps of allTps) {
                seasonPlayers.add(tps.playerId);
                const tid = teamToTournament.get(tps.teamId);
                if (tid) {
                    if (!perTournament.has(tid)) perTournament.set(tid, new Set());
                    perTournament.get(tid)!.add(tps.playerId);
                }
            }

            seasonPlayerCount = seasonPlayers.size;

            let totalUniquePlayersAllTournaments = 0;
            for (const players of perTournament.values()) {
                totalUniquePlayersAllTournaments += players.size;
            }
            avgPlayersPerTournament = perTournament.size > 0
                ? Math.round(totalUniquePlayersAllTournaments / perTournament.size)
                : 0;
        }

        const data = {
            players: {
                total: seasonPlayerCount,
                banned: bannedCount,
            },
            users: {
                total: totalUsers,
            },
            tournaments: {
                active: activeTournaments,
                total: seasonTournaments,
            },
            polls: {
                active: activePollCount,
            },
            economy: {
                totalBalance: walletAgg._sum.balance ?? 0,
            },
            teams: {
                avgPerTournament: avgPlayersPerTournament,
            },
        };

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch dashboard stats",
            error,
        });
    }
}
