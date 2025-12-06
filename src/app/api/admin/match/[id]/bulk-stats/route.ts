import { prisma } from "@/src/lib/db/prisma";
import { getUniqueMatch } from "@/src/services/match/getMatchById";
import { updateManyTeamsStats } from "@/src/services/team/updateTeamStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";
import { NextRequest } from "next/server";
import z from "zod";

const bulkStatsSchema = z.object({
    stats: z.array(teamStatsSchema),
});

/**
 * Process bulk stats update in background
 */
async function processBulkStatsInBackground(
    matchId: string,
    stats: z.infer<typeof bulkStatsSchema>["stats"],
    tournamentId: string,
    seasonId: string | null
) {
    try {
        logger.log(`[BG] Starting bulk stats update for match ${matchId}`);

        await updateManyTeamsStats({
            stats,
            matchId,
            tournamentId,
            seasonId,
        });

        // Set match back to READY
        await prisma.match.update({
            where: { id: matchId },
            data: { status: "READY" },
        });

        logger.log(`[BG] Completed bulk stats update for match ${matchId}`);
    } catch (error) {
        logger.error(`[BG] Error updating bulk stats for match ${matchId}: ${error}`);
        // Still try to set READY so it doesn't stay stuck
        try {
            await prisma.match.update({
                where: { id: matchId },
                data: { status: "READY" },
            });
        } catch { /* ignore */ }
    }
}

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

        const body = bulkStatsSchema.parse(await req.json());

        // Step 1: Set match to PROCESSING
        await prisma.match.update({
            where: { id: matchId },
            data: { status: "PROCESSING" },
        });

        // Step 2: Start background processing (don't await)
        setImmediate(() => {
            processBulkStatsInBackground(
                matchId,
                body.stats,
                isMatchExist.tournamentId,
                isMatchExist.seasonId
            );
        });

        // Step 3: Return immediately
        return SuccessResponse({
            message: "Bulk stats update started",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
