import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/tournaments/[id]/update-streaks
 * Increments streak.current for every player who participated in this tournament.
 * Updates streak.longest if current exceeds it.
 * Skips players whose streak.lastTournamentId already matches (idempotent).
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id: tournamentId } = await params;

        // Get tournament + season
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, seasonId: true, isWinnerDeclared: true },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        if (!tournament.isWinnerDeclared) {
            return NextResponse.json({ error: "Winners must be declared first" }, { status: 400 });
        }

        // Find all players who played in this tournament
        const matchPlayed = await prisma.matchPlayerPlayed.findMany({
            where: { tournamentId },
            select: { playerId: true },
            distinct: ["playerId"],
        });

        const playerIds = matchPlayed.map((m) => m.playerId);

        if (playerIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: { updated: 0, message: "No players found for this tournament" },
            });
        }

        // Get existing streaks for these players
        const streaks = await prisma.playerStreak.findMany({
            where: { playerId: { in: playerIds } },
        });

        const streakMap = new Map(streaks.map((s) => [s.playerId, s]));
        let updated = 0;

        // Update streaks in batches
        const BATCH_SIZE = 10;
        for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
            const batch = playerIds.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (playerId) => {
                const existing = streakMap.get(playerId);

                // Skip if already processed for this tournament (idempotent)
                if (existing?.lastTournamentId === tournamentId) return;

                const newCurrent = (existing?.current ?? 0) + 1;
                const newLongest = Math.max(newCurrent, existing?.longest ?? 0);

                await prisma.playerStreak.upsert({
                    where: { playerId },
                    create: {
                        playerId,
                        current: 1,
                        longest: 1,
                        seasonId: tournament.seasonId,
                        lastTournamentId: tournamentId,
                    },
                    update: {
                        current: newCurrent,
                        longest: newLongest,
                        seasonId: tournament.seasonId,
                        lastTournamentId: tournamentId,
                    },
                });
                updated++;
            });
            await Promise.all(promises);
        }

        // Reset streaks for players who DIDN'T play (break their streak)
        const playedSet = new Set(playerIds);
        const allActiveStreaks = await prisma.playerStreak.findMany({
            where: {
                current: { gt: 0 },
                seasonId: tournament.seasonId,
                lastTournamentId: { not: tournamentId },
            },
            select: { playerId: true },
        });

        const toReset = allActiveStreaks.filter((s) => !playedSet.has(s.playerId));
        if (toReset.length > 0) {
            await prisma.playerStreak.updateMany({
                where: {
                    playerId: { in: toReset.map((s) => s.playerId) },
                },
                data: { current: 0 },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                updated,
                reset: toReset.length,
                message: `Updated ${updated} streaks, reset ${toReset.length}`,
            },
        });
    } catch (error) {
        console.error("Update streaks error:", error);
        return NextResponse.json(
            { error: "Failed to update streaks" },
            { status: 500 }
        );
    }
}
