import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { prisma } from "@/src/lib/db/prisma";

/**
 * Lightweight context endpoint - returns only essential data for app initialization.
 * 
 * Optimized: Only fetches activeSeason and latestTournamentId for store initialization.
 * Tournaments and matches are fetched separately by pages that need them.
 */
export async function GET(req: Request) {
    try {
        await tokenMiddleware(req);

        // Fetch active season
        const activeSeason = await getActiveSeason();

        if (!activeSeason) {
            return SuccessResponse({
                data: {
                    activeSeason: null,
                    latestTournamentId: null,
                },
                message: "No active season found",
            });
        }

        // Get only the latest tournament ID (lightweight query)
        const latestTournament = await prisma.tournament.findFirst({
            where: { seasonId: activeSeason.id },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });

        return SuccessResponse({
            data: {
                activeSeason,
                latestTournamentId: latestTournament?.id || null,
            },
            message: "Context loaded successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
