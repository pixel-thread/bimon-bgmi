import { getUniqueMatch } from "@/src/services/match/getMatchById";
import { updateManyTeamsStats } from "@/src/services/team/updateTeamStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";
import { NextRequest } from "next/server";
import z from "zod";

const bulkStatsSchema = z.object({
    stats: z.array(teamStatsSchema),
});

/**
 * PUT handler for bulk stats update.
 * IMPORTANT: We always process synchronously to avoid serverless timeout issues.
 * Background processing with setImmediate doesn't work reliably in serverless environments
 * because the process may terminate after the response is sent.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await adminMiddleware(req);
        const matchId = (await params).id;

        const isMatchExist = await getUniqueMatch({ where: { id: matchId } });

        if (!isMatchExist) {
            return ErrorResponse({
                message: "Match not found",
                status: 404,
            });
        }

        const rawBody = await req.json();

        const parseResult = bulkStatsSchema.safeParse(rawBody);
        if (!parseResult.success) {
            const errorDetails = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            console.log(`[BULK] Validation failed: ${errorDetails}`);
            return ErrorResponse({
                message: `Validation failed: ${errorDetails}`,
                status: 400,
            });
        }

        const body = parseResult.data;
        const teamCount = body.stats.length;
        const totalPlayers = body.stats.reduce((acc, s) => acc + s.players.length, 0);

        console.log(`[BULK] Processing ${teamCount} teams, ${totalPlayers} players for match ${matchId}`);

        const startTime = Date.now();

        // Always process synchronously - serverless doesn't support reliable background processing
        await updateManyTeamsStats({
            stats: body.stats,
            matchId,
            tournamentId: isMatchExist.tournamentId,
            seasonId: isMatchExist.seasonId,
        });

        const duration = Date.now() - startTime;
        console.log(`[BULK] Processing completed in ${duration}ms`);

        return SuccessResponse({
            message: `Stats saved successfully (${duration}ms)`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[BULK] Error: ${errorMessage}`);

        // Check for transaction timeout errors and return a user-friendly message
        if (errorMessage.includes("timeout") || errorMessage.includes("expired transaction") || errorMessage.includes("Transaction already closed")) {
            return ErrorResponse({
                message: "Database operation timed out - too many operations. Please try again.",
                status: 500,
            });
        }

        return handleApiErrors(error);
    }
}
