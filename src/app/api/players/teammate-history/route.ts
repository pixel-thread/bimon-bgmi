import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/players/teammate-history
 * Returns how many times the current player has been on the same team
 * as each other player. Only counts completed tournaments (those with results).
 * Counts once per tournament.
 *
 * Query: ?seasonId=xxx (optional — filter by season)
 */
export async function GET(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findUnique({
            where: { email },
            select: { player: { select: { id: true } } },
        });
        if (!user?.player) return ErrorResponse({ message: "Player not found", status: 404 });

        const playerId = user.player.id;
        const seasonId = req.nextUrl.searchParams.get("seasonId") ?? undefined;

        // Always fetch seasons so the selector stays visible
        const seasons = await prisma.season.findMany({
            orderBy: { startDate: "desc" },
            select: { id: true, name: true },
        });

        // Get completed tournament IDs (only those with results/winners)
        const completedTournaments = await prisma.tournamentWinner.findMany({
            where: seasonId ? { tournament: { seasonId } } : {},
            select: { tournamentId: true },
        });
        const completedTournamentIds = new Set(completedTournaments.map(t => t.tournamentId));

        if (completedTournamentIds.size === 0) {
            return SuccessResponse({ data: { teammates: [], seasons, totalTournaments: 0 }, cache: CACHE.SHORT });
        }

        // Get all matches the current player played in (only completed tournaments)
        const myMatches = await prisma.matchPlayerPlayed.findMany({
            where: {
                playerId,
                tournamentId: { in: Array.from(completedTournamentIds) },
                ...(seasonId ? { seasonId } : {}),
            },
            select: { teamId: true, tournamentId: true, seasonId: true },
        });

        if (myMatches.length === 0) {
            return SuccessResponse({ data: { teammates: [], seasons, totalTournaments: 0 }, cache: CACHE.SHORT });
        }

        // Get all players on the same teams
        const teamIds = myMatches.map((m) => m.teamId);
        const allTeammates = await prisma.matchPlayerPlayed.findMany({
            where: {
                teamId: { in: teamIds },
                playerId: { not: playerId },
                ...(seasonId ? { seasonId } : {}),
            },
            select: {
                playerId: true,
                teamId: true,
                tournamentId: true,
                seasonId: true,
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { imageUrl: true } },
                    },
                },
            },
        });

        // Count per teammate: how many unique completed tournaments they were on the same team
        const countMap = new Map<string, {
            playerId: string;
            displayName: string;
            imageUrl: string | null;
            total: number;
            bySeason: Map<string, number>;
            seenTournaments: Set<string>;
        }>();

        for (const t of allTeammates) {
            // Skip if tournament wasn't completed
            if (!completedTournamentIds.has(t.tournamentId)) continue;

            const key = t.playerId;
            if (!countMap.has(key)) {
                countMap.set(key, {
                    playerId: t.playerId,
                    displayName: t.player.displayName ?? "Unknown",
                    imageUrl: t.player.user?.imageUrl ?? null,
                    total: 0,
                    bySeason: new Map(),
                    seenTournaments: new Set(),
                });
            }
            const entry = countMap.get(key)!;

            // Only count each unique tournament once
            if (!entry.seenTournaments.has(t.tournamentId)) {
                entry.seenTournaments.add(t.tournamentId);
                entry.total++;
                const sid = t.seasonId || "none";
                entry.bySeason.set(sid, (entry.bySeason.get(sid) ?? 0) + 1);
            }
        }

        // Convert to array sorted by total desc
        const teammates = Array.from(countMap.values())
            .sort((a, b) => b.total - a.total)
            .map((t) => ({
                playerId: t.playerId,
                displayName: t.displayName,
                imageUrl: t.imageUrl,
                total: t.total,
                bySeason: Object.fromEntries(t.bySeason),
            }));

        return SuccessResponse({
            data: {
                teammates,
                seasons,
                totalTournaments: new Set(myMatches.map(m => m.tournamentId)).size,
            },
            cache: CACHE.SHORT,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to load teammate history", error });
    }
}
