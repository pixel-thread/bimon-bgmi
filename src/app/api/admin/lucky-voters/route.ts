import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { getAppSetting } from "@/src/services/settings/getAppSetting";

export async function GET(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        // Get lucky voters history from AppSetting
        const luckyVotersJson = await getAppSetting("luckyVotersBySeason");
        const luckyVotersBySeason: Record<string, string[]> = luckyVotersJson
            ? JSON.parse(luckyVotersJson)
            : {};

        // Get all seasons
        const seasons = await prisma.season.findMany({
            orderBy: { startDate: "desc" },
            select: { id: true, name: true, startDate: true },
        });

        // Get all player IDs who have been lucky voters
        const allLuckyPlayerIds = new Set<string>();
        for (const playerIds of Object.values(luckyVotersBySeason)) {
            for (const id of playerIds) {
                allLuckyPlayerIds.add(id);
            }
        }

        // Get polls with luckyVoterId to find tournament names and entry fees
        const pollsWithLucky = await prisma.poll.findMany({
            where: { luckyVoterId: { not: null } },
            include: {
                tournament: {
                    select: { id: true, name: true, fee: true, seasonId: true, createdAt: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Also add luckyVoterIds from polls (in case recordLuckyVoter wasn't called yet)
        for (const poll of pollsWithLucky) {
            if (poll.luckyVoterId) {
                allLuckyPlayerIds.add(poll.luckyVoterId);
            }
        }

        // Fetch player details
        const players = await prisma.player.findMany({
            where: { id: { in: Array.from(allLuckyPlayerIds) } },
            include: { user: { select: { userName: true, displayName: true } } },
        });

        const playerMap = new Map(players.map(p => [p.id, p]));

        // Build lucky voter entries with tournament details
        const luckyVoterEntries = pollsWithLucky
            .filter(poll => poll.luckyVoterId && poll.tournament)
            .map(poll => {
                const player = playerMap.get(poll.luckyVoterId!);
                return {
                    id: poll.id,
                    playerId: poll.luckyVoterId,
                    playerName: player?.user?.displayName || player?.user?.userName || "Unknown",
                    tournamentId: poll.tournament!.id,
                    tournamentName: poll.tournament!.name,
                    entryFee: poll.tournament!.fee || 0,
                    seasonId: poll.tournament!.seasonId,
                    date: poll.tournament!.createdAt,
                };
            });

        // Calculate summary stats
        const totalFreeEntries = luckyVoterEntries.length;
        const totalUCSaved = luckyVoterEntries.reduce((sum, e) => sum + e.entryFee, 0);
        const uniquePlayers = new Set(luckyVoterEntries.map(e => e.playerId)).size;

        // Group by season for summary
        const seasonStats = seasons.map(season => {
            const seasonEntries = luckyVoterEntries.filter(e => e.seasonId === season.id);
            return {
                seasonId: season.id,
                seasonName: season.name,
                count: seasonEntries.length,
                ucSaved: seasonEntries.reduce((sum, e) => sum + e.entryFee, 0),
            };
        }).filter(s => s.count > 0);

        return SuccessResponse({
            data: {
                summary: {
                    totalFreeEntries,
                    totalUCSaved,
                    uniquePlayers,
                },
                seasonStats,
                entries: luckyVoterEntries,
            },
            status: 200,
            message: "Lucky voters fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
