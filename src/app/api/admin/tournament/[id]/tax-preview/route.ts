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

        // Get poll to check for solo voters
        const poll = await prisma.poll.findUnique({
            where: { tournamentId },
            include: {
                playersVotes: {
                    where: { playerId: { in: playerIds } },
                },
            },
        });

        // Build a set of solo player IDs
        const soloPlayerIds = new Set(
            poll?.playersVotes
                .filter((v) => v.vote === "SOLO")
                .map((v) => v.playerId) || []
        );

        const soloTaxRate = getSoloTaxRate();

        // Calculate tax info for each player
        const taxPreview: Record<string, {
            previousWins: number;
            totalWins: number;
            taxRate: number; // Combined rate (repeat + solo)
            taxPercentage: string;
            repeatWinnerTaxRate: number;
            soloTaxRate: number;
            isSolo: boolean;
        }> = {};

        for (const playerId of playerIds) {
            const previousWins = playerWinCounts.get(playerId) || 0;
            const totalWins = previousWins + 1;
            const repeatTaxRate = getTaxRate(totalWins);
            const isSolo = soloPlayerIds.has(playerId);
            const playerSoloTax = isSolo ? soloTaxRate : 0;

            // Combined tax rate (both taxes stack)
            const combinedTaxRate = repeatTaxRate + playerSoloTax;

            taxPreview[playerId] = {
                previousWins,
                totalWins,
                taxRate: combinedTaxRate,
                taxPercentage: combinedTaxRate > 0 ? `${Math.round(combinedTaxRate * 100)}%` : "0%",
                repeatWinnerTaxRate: repeatTaxRate,
                soloTaxRate: playerSoloTax,
                isSolo,
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
