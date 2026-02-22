import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/dashboard/stats
 * Fetches high-level stats for the admin dashboard.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        // Check admin role
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        // Parallel queries for dashboard stats
        const [
            totalPlayers,
            totalUsers,
            activeTournaments,
            totalTournaments,
            activePollCount,
            walletAgg,
            totalMatches,
            bannedCount,
        ] = await Promise.all([
            prisma.player.count(),
            prisma.user.count(),
            prisma.tournament.count({
                where: { status: "ACTIVE" },
            }),
            prisma.tournament.count(),
            prisma.poll.count({ where: { isActive: true } }),
            prisma.wallet.aggregate({ _sum: { balance: true } }),
            prisma.match.count(),
            prisma.player.count({ where: { isBanned: true } }),
        ]);

        const data = {
            players: {
                total: totalPlayers,
                banned: bannedCount,
            },
            users: {
                total: totalUsers,
            },
            tournaments: {
                active: activeTournaments,
                total: totalTournaments,
            },
            polls: {
                active: activePollCount,
            },
            economy: {
                totalBalance: walletAgg._sum.balance ?? 0,
            },
            matches: {
                total: totalMatches,
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
