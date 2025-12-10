import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { getTournamentBySeasonId } from "@/src/services/tournament/getTournamentBySeasonId";
import { getAllMatches } from "@/src/services/match/getAllMatches";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

/**
 * Combined context endpoint - returns active season, tournaments, and matches
 * in a single request to eliminate waterfall loading.
 * 
 * Before: 3 sequential API calls (~300-500ms)
 * After: 1 combined call (~100-150ms)
 */
export async function GET(req: Request) {
    try {
        await tokenMiddleware(req);

        // Fetch active season first (required for other queries)
        const activeSeason = await getActiveSeason();

        if (!activeSeason) {
            return SuccessResponse({
                data: {
                    activeSeason: null,
                    tournaments: [],
                    latestTournamentMatches: [],
                },
                message: "No active season found",
            });
        }

        // Fetch tournaments for the active season
        const tournaments = await getTournamentBySeasonId({
            seasonId: activeSeason.id,
        });

        // Sort tournaments by name (natural sort) and get the latest one
        const sortedTournaments = tournaments.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        );

        // Get matches for the latest tournament (if any)
        let latestTournamentMatches: Awaited<ReturnType<typeof getAllMatches>> = [];
        const latestTournament = sortedTournaments[sortedTournaments.length - 1];

        if (latestTournament) {
            latestTournamentMatches = await getAllMatches({
                where: { tournamentId: latestTournament.id },
            });
        }

        return SuccessResponse({
            data: {
                activeSeason,
                tournaments: sortedTournaments,
                latestTournamentId: latestTournament?.id || null,
                latestTournamentMatches,
            },
            message: "Context loaded successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
