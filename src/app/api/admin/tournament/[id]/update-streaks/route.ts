import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { recordTournamentParticipation, resetStreaksForNonParticipants } from "@/src/services/player/tournamentStreak";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * POST /api/admin/tournament/[id]/update-streaks
 * 
 * Manually update tournament streaks for all participants in a tournament.
 * This is a fallback endpoint in case streak updates fail during winner declaration.
 */
export async function POST(
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

        if (!tournament.isWinnerDeclared) {
            return ErrorResponse({ message: "Tournament winner must be declared first" });
        }

        // Find all players on teams in this tournament
        const tournamentTeams = await prisma.team.findMany({
            where: { tournamentId },
            include: {
                players: {
                    select: { id: true },
                },
            },
        });

        const participantPlayerIds = tournamentTeams.flatMap(team =>
            team.players.map(p => p.id)
        );

        if (participantPlayerIds.length === 0) {
            return ErrorResponse({ message: "No participants found in tournament" });
        }

        // Process streak updates
        const results = {
            updated: 0,
            failed: 0,
            rewarded: 0,
            errors: [] as string[],
        };

        const STREAK_BATCH_SIZE = 5;
        for (let i = 0; i < participantPlayerIds.length; i += STREAK_BATCH_SIZE) {
            const batch = participantPlayerIds.slice(i, i + STREAK_BATCH_SIZE);
            await Promise.all(
                batch.map(async (playerId) => {
                    try {
                        const result = await recordTournamentParticipation(playerId, tournamentId);
                        results.updated++;
                        if (result.rewardGiven) {
                            results.rewarded++;
                        }
                    } catch (error) {
                        results.failed++;
                        results.errors.push(`Player ${playerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                })
            );
        }

        // Reset streaks for players who missed this tournament
        try {
            await resetStreaksForNonParticipants(tournamentId, participantPlayerIds);
        } catch (error) {
            console.error("Failed to reset streaks for non-participants:", error);
        }

        return SuccessResponse({
            message: `Streak update complete. Updated: ${results.updated}, Failed: ${results.failed}, Rewarded: ${results.rewarded}`,
            data: {
                totalParticipants: participantPlayerIds.length,
                updated: results.updated,
                failed: results.failed,
                rewarded: results.rewarded,
                errors: results.errors.slice(0, 10), // Limit error messages
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
