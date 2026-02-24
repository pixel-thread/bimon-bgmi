import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";

/**
 * GET /api/winners/recent
 * Returns last 6 tournament results with winners, player leaderboard,
 * and total fund amount for the public winners page.
 */
export async function GET() {
    try {
        // 1. Fetch last 6 tournaments that have declared winners
        const tournaments = await prisma.tournament.findMany({
            where: {
                isWinnerDeclared: true,
                status: "ACTIVE",
            },
            orderBy: { startDate: "desc" },
            take: 6,
            select: {
                id: true,
                name: true,
                createdAt: true,
                winners: {
                    orderBy: { position: "asc" },
                    select: {
                        position: true,
                        team: {
                            select: {
                                players: {
                                    select: {
                                        displayName: true,
                                        user: {
                                            select: { username: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // 2. Transform tournaments into the expected format
        const tournamentResults = tournaments.map((t) => {
            const getPlace = (position: number) => {
                const winner = t.winners.find((w) => w.position === position);
                if (!winner) return null;
                return {
                    players: winner.team.players.map(
                        (p) => p.displayName || p.user.username
                    ),
                };
            };

            return {
                id: t.id,
                name: t.name,
                createdAt: t.createdAt.toISOString(),
                place1: getPlace(1),
                place2: getPlace(2),
                place3: getPlace(3),
            };
        });

        // 3. Build player placement leaderboard from these tournaments
        const placementMap = new Map<
            string,
            { first: number; second: number; third: number }
        >();

        for (const t of tournaments) {
            for (const w of t.winners) {
                if (w.position > 3) continue;
                for (const p of w.team.players) {
                    const name = p.displayName || p.user.username;
                    const entry = placementMap.get(name) || {
                        first: 0,
                        second: 0,
                        third: 0,
                    };
                    if (w.position === 1) entry.first++;
                    else if (w.position === 2) entry.second++;
                    else if (w.position === 3) entry.third++;
                    placementMap.set(name, entry);
                }
            }
        }

        const playerPlacements = Array.from(placementMap.entries())
            .map(([name, counts]) => ({
                name,
                firstPlaceCount: counts.first,
                secondPlaceCount: counts.second,
                thirdPlaceCount: counts.third,
                totalPlacements:
                    counts.first * 3 + counts.second * 2 + counts.third,
            }))
            .sort((a, b) => b.totalPlacements - a.totalPlacements);

        // 4. Calculate total funds from Income records with "Fund" description
        const fundIncome = await prisma.income.aggregate({
            where: {
                description: { startsWith: "Fund" },
                isSubIncome: false,
            },
            _sum: { amount: true },
        });

        const totalFunds = fundIncome._sum.amount || 0;

        return SuccessResponse({
            data: {
                tournaments: tournamentResults,
                playerPlacements,
                totalFunds,
            },
            cache: CACHE.MEDIUM,
        });
    } catch (error) {
        return ErrorResponse({
            message: "Failed to fetch recent winners",
            error,
        });
    }
}
