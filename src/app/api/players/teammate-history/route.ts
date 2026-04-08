import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/players/teammate-history
 * Returns how many times the current player has been on the same team
 * as each other player. Only counts completed tournaments (isWinnerDeclared).
 * Counts once per tournament.
 *
 * Query: ?seasonId=xxx (optional — filter by season)
 */
export async function GET(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findFirst({
            where: userWhereEmail(email),
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

        // Get all records where this player was on a team in a COMPLETED tournament
        // Uses isWinnerDeclared (same pattern as pending-merit)
        const myMatches = await prisma.matchPlayerPlayed.findMany({
            where: {
                playerId,
                tournament: {
                    isWinnerDeclared: true,
                    ...(seasonId ? { seasonId } : { seasonId: { not: null } }),
                },
            },
            select: { teamId: true, tournamentId: true, seasonId: true },
        });

        if (myMatches.length === 0) {
            return SuccessResponse({ data: { teammates: [], seasons, totalTournaments: 0 }, cache: "private, max-age=60" });
        }

        // Deduplicate: unique teams per tournament
        const uniqueTeamIds = [...new Set(myMatches.map(m => m.teamId))];

        // Get all players on the same teams (excluding self)
        const allTeammates = await prisma.matchPlayerPlayed.findMany({
            where: {
                teamId: { in: uniqueTeamIds },
                playerId: { not: playerId },
            },
            select: {
                playerId: true,
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

        // Count per teammate: unique tournaments they shared a team
        const countMap = new Map<string, {
            playerId: string;
            displayName: string;
            imageUrl: string | null;
            total: number;
            bySeason: Map<string, number>;
            seenTournaments: Set<string>;
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
                    seenTournaments: new Set(),
                });
            }
            const entry = countMap.get(key)!;

            if (!entry.seenTournaments.has(t.tournamentId)) {
                entry.seenTournaments.add(t.tournamentId);
                entry.total++;
                const sid = t.seasonId || "unknown";
                entry.bySeason.set(sid, (entry.bySeason.get(sid) ?? 0) + 1);
            }
        }

        const teammates = Array.from(countMap.values())
            .sort((a, b) => b.total - a.total)
            .map((t) => ({
                playerId: t.playerId,
                displayName: t.displayName,
                imageUrl: t.imageUrl,
                total: t.total,
                bySeason: Object.fromEntries(t.bySeason),
            }));

        const totalTournaments = new Set(myMatches.map(m => m.tournamentId)).size;

        return SuccessResponse({
            data: { teammates, seasons, totalTournaments },
            cache: "private, max-age=60",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to load teammate history", error });
    }
}
