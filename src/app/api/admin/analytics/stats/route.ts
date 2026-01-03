import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { getCategoryFromKD } from "@/src/utils/categoryUtils";

// Get current real-time stats
export async function GET(req: Request) {
    try {
        await superAdminMiddleware(req);

        // Get active season for stats calculation
        const activeSeason = await prisma.season.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true },
        });

        const [
            totalUsers,
            totalOnboardedUsers,
            totalPlayers,
            activePlayers,
            bannedPlayers,
            playersWithStats,
            totalTournaments,
            activeTournaments,
            totalMatches,
            totalTeams,
            ucStats,
            totalTransactions,
            pendingUCTransfers,
            pushSubscribers,
            incomeStats,
            prizePoolStats,
            totalSeasons,
            activeSeasons,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isOnboarded: true } }),
            prisma.player.count(),
            prisma.player.count({ where: { isBanned: false } }),
            prisma.player.count({ where: { isBanned: true } }),
            // Fetch players with their stats for dynamic category calculation
            prisma.player.findMany({
                select: {
                    id: true,
                    playerStats: {
                        where: activeSeason ? { seasonId: activeSeason.id } : {},
                        select: { kills: true, deaths: true },
                    },
                },
            }),
            prisma.tournament.count(),
            prisma.tournament.count({ where: { status: "ACTIVE" } }),
            prisma.match.count(),
            prisma.team.count(),
            prisma.uC.aggregate({ _sum: { balance: true } }),
            prisma.transaction.count(),
            prisma.uCTransfer.count({ where: { status: "PENDING" } }),
            prisma.pushSubscription.count(),
            prisma.income.aggregate({ _sum: { amount: true } }),
            prisma.tournamentWinner.aggregate({ _sum: { amount: true } }),
            prisma.season.count(),
            prisma.season.count({ where: { status: "ACTIVE" } }),
        ]);

        // Calculate categories dynamically from actual kills/deaths
        const categoryCounts = {
            BOT: 0,
            ULTRA_NOOB: 0,
            NOOB: 0,
            PRO: 0,
            ULTRA_PRO: 0,
            LEGEND: 0,
        };

        for (const player of playersWithStats) {
            const stats = player.playerStats[0];
            const kills = stats?.kills ?? 0;
            const deaths = stats?.deaths ?? 0;
            const category = getCategoryFromKD(kills, deaths);
            categoryCounts[category]++;
        }

        return NextResponse.json({
            users: {
                total: totalUsers,
                onboarded: totalOnboardedUsers,
            },
            players: {
                total: totalPlayers,
                active: activePlayers,
                banned: bannedPlayers,
                categories: {
                    bot: categoryCounts.BOT,
                    ultraNoob: categoryCounts.ULTRA_NOOB,
                    noob: categoryCounts.NOOB,
                    pro: categoryCounts.PRO,
                    ultraPro: categoryCounts.ULTRA_PRO,
                    legend: categoryCounts.LEGEND,
                },
            },
            tournaments: {
                total: totalTournaments,
                active: activeTournaments,
            },
            matches: totalMatches,
            teams: totalTeams,
            economy: {
                totalUC: ucStats._sum.balance || 0,
                transactions: totalTransactions,
                pendingTransfers: pendingUCTransfers,
            },
            engagement: {
                pushSubscribers,
            },
            income: incomeStats._sum.amount || 0,
            prizePool: prizePoolStats._sum.amount || 0,
            seasons: {
                total: totalSeasons,
                active: activeSeasons,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics stats:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch analytics", details: errorMessage },
            { status: 500 }
        );
    }
}
