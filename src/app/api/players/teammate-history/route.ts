import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/players/teammate-history
 * Returns how many times the current player has been on the same team
 * as each other player, grouped by season. Sorted by frequency desc.
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

        // Get all matches the current player played in
        const myMatches = await prisma.matchPlayerPlayed.findMany({
            where: { playerId, ...(seasonId ? { seasonId } : {}) },
            select: { teamId: true, matchId: true, seasonId: true },
        });

        if (myMatches.length === 0) {
            return SuccessResponse({ data: { teammates: [], seasons: [] }, cache: CACHE.SHORT });
        }

        // Get all players on the same teams in those matches
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

        // Build teammate-match map: how many times each teammate on same team
        const myTeamMatchMap = new Map<string, string>(); // teamId -> matchId
        for (const m of myMatches) {
            myTeamMatchMap.set(m.teamId, m.matchId);
        }

        // Count per teammate per season
        const countMap = new Map<string, {
            playerId: string;
            displayName: string;
            imageUrl: string | null;
            total: number;
            bySeason: Map<string, number>;
        }>();

        for (const t of allTeammates) {
            const key = t.playerId;
            if (!countMap.has(key)) {
                countMap.set(key, {
                    playerId: t.playerId,
                    displayName: t.player.displayName ?? "Unknown",
                    imageUrl: t.player.user?.imageUrl ?? null,
                    total: 0,
                    bySeason: new Map(),
                });
            }
            const entry = countMap.get(key)!;
            entry.total++;
            const sid = t.seasonId || "none";
            entry.bySeason.set(sid, (entry.bySeason.get(sid) ?? 0) + 1);
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

        // Get available seasons for the filter
        const seasons = await prisma.season.findMany({
            orderBy: { startDate: "desc" },
            select: { id: true, name: true },
        });

        return SuccessResponse({
            data: {
                teammates,
                seasons,
                totalMatches: myMatches.length,
            },
            cache: CACHE.SHORT,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to load teammate history", error });
    }
}
