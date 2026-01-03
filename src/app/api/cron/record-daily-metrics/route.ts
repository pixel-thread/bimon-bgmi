import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { startOfDay, subDays, parseISO } from "date-fns";

// Helper to get current date in India timezone (IST)
function getIndiaDate(): Date {
    const now = new Date();
    // Convert to India time string, then parse back
    const indiaDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return parseISO(indiaDateStr);
}

// This endpoint is called by Vercel cron at midnight IST (18:30 UTC)
export async function GET(req: Request) {
    try {
        // Verify this is a cron request (Vercel sets this header)
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // In development or if no CRON_SECRET is set, allow the request
            if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        // Use India timezone for date
        const today = startOfDay(getIndiaDate());
        const yesterday = subDays(today, 1);

        // Check if we already have today's snapshot
        const existing = await prisma.dailyMetrics.findUnique({
            where: { date: today },
        });

        if (existing) {
            return NextResponse.json({
                message: "Snapshot already exists for today",
                date: today,
            });
        }

        // Gather all metrics
        const [
            totalUsers,
            totalOnboardedUsers,
            newUsersToday,
            totalPlayers,
            activePlayers,
            bannedPlayers,
            categoryBreakdown,
            totalTournaments,
            activeTournaments,
            totalMatches,
            totalTeams,
            ucStats,
            totalTransactions,
            pendingUCTransfers,
            pushSubscribers,
            totalNotifications,
            incomeStats,
            prizePoolStats,
        ] = await Promise.all([
            // User metrics
            prisma.user.count(),
            prisma.user.count({ where: { isOnboarded: true } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: yesterday, lt: today },
                },
            }),
            // Player metrics
            prisma.player.count(),
            prisma.player.count({ where: { isBanned: false } }),
            prisma.player.count({ where: { isBanned: true } }),
            // Category breakdown
            prisma.player.groupBy({
                by: ["category"],
                _count: { category: true },
            }),
            // Tournament metrics
            prisma.tournament.count(),
            prisma.tournament.count({ where: { status: "ACTIVE" } }),
            prisma.match.count(),
            prisma.team.count(),
            // UC Economy
            prisma.uC.aggregate({ _sum: { balance: true } }),
            prisma.transaction.count(),
            prisma.uCTransfer.count({ where: { status: "PENDING" } }),
            // Engagement
            prisma.pushSubscription.count(),
            prisma.notification.count(),
            // Income
            prisma.income.aggregate({ _sum: { amount: true } }),
            // Prize pool
            prisma.tournamentWinner.aggregate({ _sum: { amount: true } }),
        ]);

        // Process category breakdown
        const categories = categoryBreakdown.reduce(
            (acc, item) => {
                acc[item.category] = item._count.category;
                return acc;
            },
            {} as Record<string, number>
        );

        // Create the daily snapshot
        const snapshot = await prisma.dailyMetrics.create({
            data: {
                date: today,
                totalUsers,
                totalOnboardedUsers,
                newUsersToday,
                totalPlayers,
                activePlayers,
                bannedPlayers,
                botPlayers: categories.BOT || 0,
                ultraNoobPlayers: categories.ULTRA_NOOB || 0,
                noobPlayers: categories.NOOB || 0,
                proPlayers: categories.PRO || 0,
                ultraProPlayers: categories.ULTRA_PRO || 0,
                legendPlayers: categories.LEGEND || 0,
                totalTournaments,
                activeTournaments,
                totalMatches,
                totalTeams,
                totalUCInCirculation: ucStats._sum.balance || 0,
                totalTransactions,
                pendingUCTransfers,
                pushSubscribers,
                totalNotifications,
                totalIncome: incomeStats._sum.amount || 0,
                totalPrizePool: prizePoolStats._sum.amount || 0,
            },
        });

        return NextResponse.json({
            message: "Daily metrics snapshot recorded",
            snapshot,
        });
    } catch (error) {
        console.error("Error recording daily metrics:", error);
        return NextResponse.json(
            { error: "Failed to record daily metrics" },
            { status: 500 }
        );
    }
}
