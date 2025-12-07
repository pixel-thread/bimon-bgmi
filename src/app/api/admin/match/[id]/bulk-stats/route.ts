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

// Threshold: process synchronously if ≤ this many teams (faster for small datasets)
const SYNC_THRESHOLD = 8;
// Safety timeout: auto-reset to READY after this many seconds
const PROCESSING_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Process bulk stats update in background with timeout protection
 */
async function processBulkStatsInBackground(
    matchId: string,
    stats: z.infer<typeof bulkStatsSchema>["stats"],
    tournamentId: string,
    seasonId: string | null
) {
    const startTime = Date.now();

    try {
        logger.log(`[BG] Starting bulk stats update for match ${matchId} (${stats.length} teams)`);

        await updateManyTeamsStats({
            stats,
            matchId,
            tournamentId,
            seasonId,
        });

        const duration = Date.now() - startTime;
        logger.log(`[BG] Completed bulk stats update for match ${matchId} in ${duration}ms`);
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[BG] Error updating bulk stats for match ${matchId} after ${duration}ms: ${error}`);
    } finally {
        // ALWAYS set back to READY, even on error
        try {
            await prisma.match.update({
                where: { id: matchId },
                data: { status: "READY" },
            });
            logger.log(`[BG] Match ${matchId} status set to READY`);
        } catch (resetError) {
            logger.error(`[BG] Failed to reset match ${matchId} to READY: ${resetError}`);
        }
    }
}

/**
 * Set up a safety timeout that will reset the match to READY
 * if it's still PROCESSING after the timeout period
 */
function setupSafetyTimeout(matchId: string) {
    setTimeout(async () => {
        try {
            const match = await prisma.match.findUnique({
                where: { id: matchId },
                select: { status: true },
            });

            if (match?.status === "PROCESSING") {
                logger.warn(`[SAFETY] Match ${matchId} still PROCESSING after timeout, forcing READY`);
                await prisma.match.update({
                    where: { id: matchId },
                    data: { status: "READY" },
                });
            }
        } catch (error) {
            logger.error(`[SAFETY] Error checking/resetting match ${matchId}: ${error}`);
        }
    }, PROCESSING_TIMEOUT_MS);
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
        const teamCount = body.stats.length;
        const totalPlayers = body.stats.reduce((acc, s) => acc + s.players.length, 0);

        logger.log(`[BULK] Processing ${teamCount} teams, ${totalPlayers} players for match ${matchId}`);

        // For small datasets, process synchronously (faster overall)
        if (teamCount <= SYNC_THRESHOLD) {
            logger.log(`[BULK] Small dataset (${teamCount} ≤ ${SYNC_THRESHOLD}), processing synchronously`);

            const startTime = Date.now();

            await updateManyTeamsStats({
                stats: body.stats,
                matchId,
                tournamentId: isMatchExist.tournamentId,
                seasonId: isMatchExist.seasonId,
            });

            const duration = Date.now() - startTime;
            logger.log(`[BULK] Sync processing completed in ${duration}ms`);

            return SuccessResponse({
                message: `Stats saved successfully (${duration}ms)`,
            });
        }

        // For larger datasets, use background processing with safety timeout
        logger.log(`[BULK] Large dataset (${teamCount} > ${SYNC_THRESHOLD}), processing in background`);

        // Step 1: Set match to PROCESSING
        await prisma.match.update({
            where: { id: matchId },
            data: { status: "PROCESSING" },
        });

        // Step 2: Set up safety timeout (prevents stuck PROCESSING)
        setupSafetyTimeout(matchId);

        // Step 3: Start background processing
        setImmediate(() => {
            processBulkStatsInBackground(
                matchId,
                body.stats,
                isMatchExist.tournamentId,
                isMatchExist.seasonId
            );
        });

        // Step 4: Return immediately
        return SuccessResponse({
            message: "Bulk stats update started - processing in background",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
