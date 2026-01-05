import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { getPlayerRecentWins } from "@/src/services/winner/getPlayerRecentWins";
import { getTaxRate } from "@/src/utils/repeatWinnerTax";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * Get tax preview for tournament winners before declaring.
 * Returns player win counts and calculated tax rates.
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

        // Calculate tax info for each player
        const taxPreview: Record<string, {
            previousWins: number;
            totalWins: number; // including current
            taxRate: number;
            taxPercentage: string;
        }> = {};

        for (const playerId of playerIds) {
            const previousWins = playerWinCounts.get(playerId) || 0;
            const totalWins = previousWins + 1; // +1 for current win
            const taxRate = getTaxRate(totalWins);

            taxPreview[playerId] = {
                previousWins,
                totalWins,
                taxRate,
                taxPercentage: `${Math.round(taxRate * 100)}%`,
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
