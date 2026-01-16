import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { startOfDay, subDays, addDays, parseISO, differenceInDays } from "date-fns";

// Helper to get current date in India timezone (IST)
function getIndiaDate(): Date {
    const now = new Date();
    // Convert to India time string, then parse back
    const indiaDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return parseISO(indiaDateStr);
}

// Calculate metrics for a specific date (using createdAt filters for historical accuracy)
async function calculateMetricsForDate(targetDate: Date) {
    const nextDay = addDays(targetDate, 1);
    const previousDay = subDays(targetDate, 1);

    const [
        totalUsers,
        totalOnboardedUsers,
        newUsersOnDate,
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
        // User metrics - count users created before end of target date
        prisma.user.count({ where: { createdAt: { lt: nextDay } } }),
        prisma.user.count({ where: { isOnboarded: true, createdAt: { lt: nextDay } } }),
        // New users on this specific date
        prisma.user.count({
            where: {
                createdAt: { gte: targetDate, lt: nextDay },
            },
        }),
        // Player metrics - players created before end of target date
        prisma.player.count({ where: { createdAt: { lt: nextDay } } }),
        // Note: isBanned status is current, not historical - this is a limitation
        prisma.player.count({ where: { isBanned: false, createdAt: { lt: nextDay } } }),
        prisma.player.count({ where: { isBanned: true, createdAt: { lt: nextDay } } }),
        // Category breakdown - players created before end of target date
        prisma.player.groupBy({
            by: ["category"],
            where: { createdAt: { lt: nextDay } },
            _count: { category: true },
        }),
        // Tournament metrics
        prisma.tournament.count({ where: { createdAt: { lt: nextDay } } }),
        // Active tournaments is current status - limitation for historical
        prisma.tournament.count({ where: { status: "ACTIVE", createdAt: { lt: nextDay } } }),
        prisma.match.count({ where: { createdAt: { lt: nextDay } } }),
        prisma.team.count({ where: { createdAt: { lt: nextDay } } }),
        // UC Economy - current balance only (can't backfill historically)
        prisma.uC.aggregate({ _sum: { balance: true } }),
        prisma.transaction.count({ where: { timestamp: { lt: nextDay } } }),
        // Pending status is current - limitation
        prisma.uCTransfer.count({ where: { status: "PENDING" } }),
        // Engagement
        prisma.pushSubscription.count({ where: { createdAt: { lt: nextDay } } }),
        prisma.notification.count({ where: { createdAt: { lt: nextDay } } }),
        // Income - sum up to end of target date
        prisma.income.aggregate({
            _sum: { amount: true },
            where: { createdAt: { lt: nextDay } }
        }),
        // Prize pool - sum up to end of target date
        prisma.tournamentWinner.aggregate({
            _sum: { amount: true },
            where: { createdAt: { lt: nextDay } }
        }),
    ]);

    // Process category breakdown
    const categories = categoryBreakdown.reduce(
        (acc, item) => {
            acc[item.category] = item._count.category;
            return acc;
        },
        {} as Record<string, number>
    );

    return {
        date: targetDate,
        totalUsers,
        totalOnboardedUsers,
        newUsersToday: newUsersOnDate,
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
    };
}

// This endpoint can be called anytime - it backfills all missing days
// No need for daily cron - run it weekly or whenever you want
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

        // Find the last recorded date
        const lastRecord = await prisma.dailyMetrics.findFirst({
            orderBy: { date: "desc" },
            select: { date: true },
        });

        // Start from day after last record, or 30 days ago if no records exist
        const startDate = lastRecord
            ? addDays(startOfDay(lastRecord.date), 1)
            : subDays(today, 30);

        // Calculate how many days we need to backfill (up to and including yesterday)
        const yesterday = subDays(today, 1);
        const daysToBackfill = differenceInDays(yesterday, startDate) + 1;

        if (daysToBackfill <= 0) {
            return NextResponse.json({
                message: "All metrics are up to date",
                lastRecordedDate: lastRecord?.date || null,
            });
        }

        // Limit backfill to prevent timeout (max 30 days at a time)
        const maxDays = Math.min(daysToBackfill, 30);
        const snapshots: { date: Date }[] = [];

        // Process each missing day
        for (let i = 0; i < maxDays; i++) {
            const targetDate = addDays(startDate, i);

            // Skip if already exists (shouldn't happen, but safety check)
            const existing = await prisma.dailyMetrics.findUnique({
                where: { date: targetDate },
            });

            if (existing) continue;

            // Calculate and store metrics for this date
            const metricsData = await calculateMetricsForDate(targetDate);
            const snapshot = await prisma.dailyMetrics.create({
                data: metricsData,
            });
            snapshots.push({ date: snapshot.date });
        }

        return NextResponse.json({
            message: `Backfilled ${snapshots.length} days of metrics`,
            daysProcessed: snapshots.length,
            remainingDays: daysToBackfill - maxDays,
            dates: snapshots.map(s => s.date),
        });
    } catch (error) {
        console.error("Error recording daily metrics:", error);
        return NextResponse.json(
            { error: "Failed to record daily metrics" },
            { status: 500 }
        );
    }
}
