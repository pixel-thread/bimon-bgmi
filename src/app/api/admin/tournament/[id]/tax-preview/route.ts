import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { getPlayerRecentWins } from "@/src/services/winner/getPlayerRecentWins";
import { getTaxRate } from "@/src/utils/repeatWinnerTax";
import { getSoloTaxRate } from "@/src/utils/soloTax";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * Get tax preview for tournament winners before declaring.
 * Returns player win counts, calculated tax rates, and match participation data.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await superAdminMiddleware(req);
        const tournamentId = (await params).id;

        const tournament = await getTournamentById({ id: tournamentId });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found" });
        }

        // Get player IDs from query params
        const { searchParams } = new URL(req.url);
        const playerIdsParam = searchParams.get("playerIds");

        if (!playerIdsParam) {
            return ErrorResponse({ message: "playerIds query parameter is required" });
        }

        const playerIds = playerIdsParam.split(",");

        // Get recent wins for each player
        const playerWinCounts = await getPlayerRecentWins(
            playerIds,
            tournament.seasonId || "",
            6
        );

        // Get total matches in tournament
        const totalMatches = await prisma.match.count({
            where: { tournamentId },
        });

        // Get matches played per player using TeamPlayerStats
        // (TeamPlayerStats has one entry per player per match they participated in)
        const playerMatchCounts = await prisma.teamPlayerStats.groupBy({
            by: ['playerId'],
            where: {
                playerId: { in: playerIds },
                teamStats: { tournamentId },
            },
            _count: { matchId: true },
        });

        // Build map of playerId -> matchesPlayed
        const matchesPlayedMap = new Map<string, number>();
        for (const record of playerMatchCounts) {
            matchesPlayedMap.set(record.playerId, record._count.matchId);
        }

        // Get teams to check actual solo status (team with only 1 player)
        const teams = await prisma.team.findMany({
            where: {
                tournamentId,
                players: {
                    some: { id: { in: playerIds } },
                },
            },
            include: {
                players: {
                    select: { id: true },
                },
            },
        });

        // Build a set of solo player IDs (players who are the only one in their team)
        const soloPlayerIds = new Set<string>();
        for (const team of teams) {
            if (team.players.length === 1) {
                soloPlayerIds.add(team.players[0].id);
            }
        }

        const soloTaxRate = getSoloTaxRate();

        // Calculate tax info for each player
        const taxPreview: Record<string, {
            previousWins: number;
            totalWins: number;
            taxRate: number;
            taxPercentage: string;
            repeatWinnerTaxRate: number;
            soloTaxRate: number;
            isSolo: boolean;
            // Match participation data
            matchesPlayed: number;
            totalMatches: number;
            participationRate: number;
        }> = {};

        for (const playerId of playerIds) {
            const previousWins = playerWinCounts.get(playerId) || 0;
            const totalWins = previousWins + 1;
            const repeatTaxRate = getTaxRate(totalWins);
            const isSolo = soloPlayerIds.has(playerId);
            const playerSoloTax = isSolo ? soloTaxRate : 0;

            // Combined tax rate (both taxes stack)
            const combinedTaxRate = repeatTaxRate + playerSoloTax;

            // Match participation
            const matchesPlayed = matchesPlayedMap.get(playerId) || 0;
            const participationRate = totalMatches > 0 ? matchesPlayed / totalMatches : 1;

            taxPreview[playerId] = {
                previousWins,
                totalWins,
                taxRate: combinedTaxRate,
                taxPercentage: combinedTaxRate > 0 ? `${Math.round(combinedTaxRate * 100)}%` : "0%",
                repeatWinnerTaxRate: repeatTaxRate,
                soloTaxRate: playerSoloTax,
                isSolo,
                matchesPlayed,
                totalMatches,
                participationRate,
            };
        }

        return SuccessResponse({
            message: "Tax preview",
            data: taxPreview,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

