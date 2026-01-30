import { prisma } from "@/src/lib/db/prisma";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";

/**
 * GET /api/admin/merit-ratings/pending
 * Get all players who have pending merit ratings to submit
 */
export async function GET(req: Request) {
    try {
        await adminMiddleware(req);

        const activeSeason = await getActiveSeason();
        if (!activeSeason) {
            return SuccessResponse({
                data: { players: [] },
                message: "No active season",
            });
        }

        // Find players who participated in declared tournaments but haven't rated all teammates
        // Step 1: Get all declared tournaments in active season
        const declaredTournaments = await prisma.tournament.findMany({
            where: {
                seasonId: activeSeason.id,
                isWinnerDeclared: true,
            },
            select: { id: true, name: true },
        });

        if (declaredTournaments.length === 0) {
            return SuccessResponse({
                data: { players: [] },
                message: "No declared tournaments",
            });
        }

        // Step 2: Get all match player played records for these tournaments
        const mppRecords = await prisma.matchPlayerPlayed.findMany({
            where: {
                tournamentId: { in: declaredTournaments.map(t => t.id) },
            },
            include: {
                player: {
                    include: {
                        user: { select: { displayName: true, userName: true } },
                    },
                },
                team: true,
                tournament: { select: { id: true, name: true } },
            },
            distinct: ['playerId', 'tournamentId'],
        });

        // Group by player and tournament
        const playerTournamentMap = new Map<string, {
            playerId: string;
            displayName: string;
            userName: string;
            tournamentId: string;
            tournamentName: string;
            teamId: string;
        }[]>();

        for (const mpp of mppRecords) {
            const key = mpp.playerId;
            if (!playerTournamentMap.has(key)) {
                playerTournamentMap.set(key, []);
            }
            playerTournamentMap.get(key)!.push({
                playerId: mpp.playerId,
                displayName: mpp.player.user.displayName || mpp.player.user.userName,
                userName: mpp.player.user.userName,
                tournamentId: mpp.tournamentId,
                tournamentName: mpp.tournament.name,
                teamId: mpp.teamId,
            });
        }

        // Step 3: For each player, find how many teammates they haven't rated
        const playersWithPending: {
            id: string;
            displayName: string;
            userName: string;
            pendingCount: number;
            tournamentName: string;
        }[] = [];

        for (const [playerId, tournaments] of playerTournamentMap.entries()) {
            // Get most recent tournament for this player
            const mostRecent = tournaments[0]; // Already sorted by createdAt desc in mpp query? Actually no, need to check

            // Find teammates in same team and tournament
            const teammates = mppRecords.filter(
                m => m.teamId === mostRecent.teamId &&
                    m.tournamentId === mostRecent.tournamentId &&
                    m.playerId !== playerId
            );

            if (teammates.length === 0) continue; // Solo player

            // Check existing ratings
            const existingRatings = await prisma.playerMeritRating.findMany({
                where: {
                    fromPlayerId: playerId,
                    tournamentId: mostRecent.tournamentId,
                },
                select: { toPlayerId: true },
            });

            const ratedPlayerIds = new Set(existingRatings.map(r => r.toPlayerId));
            const unratedCount = teammates.filter(t => !ratedPlayerIds.has(t.playerId)).length;

            if (unratedCount > 0) {
                playersWithPending.push({
                    id: playerId,
                    displayName: mostRecent.displayName,
                    userName: mostRecent.userName,
                    pendingCount: unratedCount,
                    tournamentName: mostRecent.tournamentName,
                });
            }
        }

        // Sort by pending count (highest first)
        playersWithPending.sort((a, b) => b.pendingCount - a.pendingCount);

        return SuccessResponse({
            data: {
                players: playersWithPending,
                totalPending: playersWithPending.reduce((sum, p) => sum + p.pendingCount, 0),
            },
            message: "Pending ratings fetched",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
