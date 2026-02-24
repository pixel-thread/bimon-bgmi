import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";

/**
 * GET /api/dashboard/lucky-voters
 * Lucky Voter Tracker: shows all lucky voter winners per tournament
 */
export async function GET() {
    try {
        await requireSuperAdmin();

        // All polls with luckyVoterId set
        const polls = await prisma.poll.findMany({
            where: { luckyVoterId: { not: null } },
            select: {
                id: true,
                luckyVoterId: true,
                tournament: {
                    select: {
                        id: true,
                        name: true,
                        fee: true,
                        seasonId: true,
                        createdAt: true,
                        season: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { tournament: { createdAt: "desc" } },
        });

        // Get player details
        const playerIds = [...new Set(polls.map((p) => p.luckyVoterId!))];
        const players = await prisma.player.findMany({
            where: { id: { in: playerIds } },
            select: {
                id: true,
                displayName: true,
                userId: true,
            },
        });
        const playerMap = new Map(players.map((p) => [p.id, p]));

        // Get user avatars
        const userIds = players.map((p) => p.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, imageUrl: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        // Build winners list
        const winners = polls
            .filter((p) => p.tournament)
            .map((poll) => {
                const player = playerMap.get(poll.luckyVoterId!);
                const user = player ? userMap.get(player.userId) : null;
                return {
                    pollId: poll.id,
                    playerId: poll.luckyVoterId!,
                    playerName: player?.displayName ?? "Unknown",
                    username: user?.username ?? "unknown",
                    imageUrl: user?.imageUrl ?? "",
                    tournamentId: poll.tournament!.id,
                    tournamentName: poll.tournament!.name,
                    ucSaved: poll.tournament!.fee ?? 0,
                    seasonId: poll.tournament!.seasonId,
                    seasonName: poll.tournament!.season?.name ?? "None",
                    date: poll.tournament!.createdAt,
                };
            });

        // Stats
        const totalUCGiven = winners.reduce((sum, w) => sum + w.ucSaved, 0);
        const uniquePlayers = new Set(winners.map((w) => w.playerId)).size;

        // By season
        const seasonMap = new Map<string, { name: string; count: number; uc: number }>();
        for (const w of winners) {
            const key = w.seasonId ?? "none";
            const existing = seasonMap.get(key) || { name: w.seasonName, count: 0, uc: 0 };
            existing.count++;
            existing.uc += w.ucSaved;
            seasonMap.set(key, existing);
        }
        const bySeason = Array.from(seasonMap.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            count: data.count,
            uc: data.uc,
        }));

        return NextResponse.json({
            data: {
                winners,
                stats: {
                    freeEntries: winners.length,
                    totalUCGiven,
                    uniquePlayers,
                },
                bySeason,
            },
        });
    } catch (error) {
        console.error("[Lucky Voters API Error]", error);
        return NextResponse.json(
            { error: "Failed to fetch lucky voter data" },
            { status: 500 }
        );
    }
}
