import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { subDays, subMonths, subWeeks, startOfDay, format } from "date-fns";

// Get historical growth data for charts - period-over-period comparison
export async function GET(req: Request) {
    try {
        await superAdminMiddleware(req);

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "month"; // week, month, quarter, year

        // Calculate date ranges for current and previous periods
        const now = new Date();
        let periodDays: number;
        let currentStart: Date;
        let previousStart: Date;
        let previousEnd: Date;

        switch (period) {
            case "week":
                periodDays = 7;
                currentStart = subWeeks(now, 1);
                previousStart = subWeeks(now, 2);
                previousEnd = subDays(currentStart, 1);
                break;
            case "month":
                periodDays = 30;
                currentStart = subMonths(now, 1);
                previousStart = subMonths(now, 2);
                previousEnd = subDays(currentStart, 1);
                break;
            case "quarter":
                periodDays = 90;
                currentStart = subMonths(now, 3);
                previousStart = subMonths(now, 6);
                previousEnd = subDays(currentStart, 1);
                break;
            case "year":
                periodDays = 365;
                currentStart = subMonths(now, 12);
                previousStart = subMonths(now, 24);
                previousEnd = subDays(currentStart, 1);
                break;
            case "lifetime":
                // Get all data from the very beginning
                periodDays = 365 * 5; // 5 years
                currentStart = new Date(2020, 0, 1); // From Jan 2020
                previousStart = new Date(2020, 0, 1);
                previousEnd = new Date(2020, 0, 1);
                break;
            default:
                periodDays = 30;
                currentStart = subMonths(now, 1);
                previousStart = subMonths(now, 2);
                previousEnd = subDays(currentStart, 1);
        }

        // Fetch metrics for both periods
        const [currentMetrics, previousMetrics] = await Promise.all([
            prisma.dailyMetrics.findMany({
                where: {
                    date: {
                        gte: startOfDay(currentStart),
                        lte: startOfDay(now),
                    },
                },
                orderBy: { date: "asc" },
            }),
            prisma.dailyMetrics.findMany({
                where: {
                    date: {
                        gte: startOfDay(previousStart),
                        lte: startOfDay(previousEnd),
                    },
                },
                orderBy: { date: "asc" },
            }),
        ]);

        // Calculate totals for comparison
        const currentTotal = currentMetrics.reduce((sum, m) => sum + m.newUsersToday, 0);
        const previousTotal = previousMetrics.reduce((sum, m) => sum + m.newUsersToday, 0);

        // Calculate growth percentages
        const latestMetrics = currentMetrics[currentMetrics.length - 1];
        const oldestMetrics = currentMetrics[0];

        let growth = null;
        if (latestMetrics && oldestMetrics) {
            const calculateGrowth = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            growth = {
                users: calculateGrowth(latestMetrics.totalUsers, oldestMetrics.totalUsers),
                players: calculateGrowth(latestMetrics.totalPlayers, oldestMetrics.totalPlayers),
                tournaments: calculateGrowth(latestMetrics.totalTournaments, oldestMetrics.totalTournaments),
                matches: calculateGrowth(latestMetrics.totalMatches, oldestMetrics.totalMatches),
                uc: calculateGrowth(latestMetrics.totalUCInCirculation, oldestMetrics.totalUCInCirculation),
                subscribers: calculateGrowth(latestMetrics.pushSubscribers, oldestMetrics.pushSubscribers),
            };
        }

        // Build comparison chart data - align by day number (Day 1, Day 2, etc.)
        const maxDays = Math.max(currentMetrics.length, previousMetrics.length, periodDays);
        const comparisonData = [];

        for (let i = 0; i < maxDays; i++) {
            const currentDay = currentMetrics[i];
            const previousDay = previousMetrics[i];

            comparisonData.push({
                day: `Day ${i + 1}`,
                dayNum: i + 1,
                // Current period
                currentUsers: currentDay?.totalUsers || 0,
                currentPlayers: currentDay?.totalPlayers || 0,
                // Previous period  
                previousUsers: previousDay?.totalUsers || 0,
                previousPlayers: previousDay?.totalPlayers || 0,
                currentDate: currentDay ? format(currentDay.date, "MMM d") : null,
                previousDate: previousDay ? format(previousDay.date, "MMM d") : null,
            });
        }

        // Get totals from latest day of each period
        const currentLatest = currentMetrics[currentMetrics.length - 1];
        const previousLatest = previousMetrics[previousMetrics.length - 1];

        return NextResponse.json({
            period,
            growth,
            comparisonData,
            totals: {
                currentUsers: currentLatest?.totalUsers || 0,
                previousUsers: previousLatest?.totalUsers || 0,
                currentPlayers: currentLatest?.totalPlayers || 0,
                previousPlayers: previousLatest?.totalPlayers || 0,
                usersChange: previousLatest?.totalUsers
                    ? Math.round(((currentLatest?.totalUsers || 0) - previousLatest.totalUsers) / previousLatest.totalUsers * 100)
                    : 0,
                playersChange: previousLatest?.totalPlayers
                    ? Math.round(((currentLatest?.totalPlayers || 0) - previousLatest.totalPlayers) / previousLatest.totalPlayers * 100)
                    : 0,
            },
            summary: latestMetrics
                ? {
                    totalUsers: latestMetrics.totalUsers,
                    totalPlayers: latestMetrics.totalPlayers,
                    totalTournaments: latestMetrics.totalTournaments,
                    totalMatches: latestMetrics.totalMatches,
                    totalUC: latestMetrics.totalUCInCirculation,
                    totalIncome: latestMetrics.totalIncome,
                }
                : null,
        });
    } catch (error) {
        console.error("Error fetching growth data:", error);
        return NextResponse.json(
            { error: "Failed to fetch growth data" },
            { status: 500 }
        );
    }
}
