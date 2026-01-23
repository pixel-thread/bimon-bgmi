import { prisma } from "@/src/lib/db/prisma";
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

const tournamentBulkStatsSchema = z.object({
    matches: z.array(z.object({
        matchId: z.string(),
        stats: z.array(teamStatsSchema),
    })),
});

/**
 * PUT handler for tournament-level bulk stats update.
 * Saves ALL matches in a single transaction - all-or-nothing atomicity.
 * If any match fails, the entire operation is rolled back.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await adminMiddleware(req);
        const tournamentId = (await params).id;

        // Verify tournament exists
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, seasonId: true },
        });

        if (!tournament) {
            return ErrorResponse({
                message: "Tournament not found",
                status: 404,
            });
        }

        const rawBody = await req.json();
        const parseResult = tournamentBulkStatsSchema.safeParse(rawBody);

        if (!parseResult.success) {
            const errorDetails = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            logger.log(`[TOURNAMENT_BULK] Validation failed: ${errorDetails}`);
            return ErrorResponse({
                message: `Validation failed: ${errorDetails}`,
                status: 400,
            });
        }

        const body = parseResult.data;
        const matchCount = body.matches.length;
        const totalTeams = body.matches.reduce((acc, m) => acc + m.stats.length, 0);
        const totalPlayers = body.matches.reduce((acc, m) =>
            acc + m.stats.reduce((a, s) => a + s.players.length, 0), 0);

        logger.log(`[TOURNAMENT_BULK] Processing ${matchCount} matches, ${totalTeams} teams, ${totalPlayers} players for tournament ${tournamentId}`);

        const startTime = Date.now();
        const seasonId = tournament.seasonId;

        // ALL-OR-NOTHING: Single transaction for ALL matches
        await prisma.$transaction(async (tx) => {
            const allPlayerIds = new Set<string>();

            // Process each match sequentially within the same transaction
            for (const matchData of body.matches) {
                const { matchId, stats } = matchData;

                // Verify match exists and belongs to this tournament
                const match = await tx.match.findUnique({
                    where: { id: matchId },
                    select: { id: true, tournamentId: true },
                });

                if (!match || match.tournamentId !== tournamentId) {
                    throw new Error(`Match ${matchId} not found or doesn't belong to this tournament`);
                }

                // STEP 1: Upsert all TeamStats for this match
                const teamStatsPromises = stats.map((stat) =>
                    tx.teamStats.upsert({
                        where: {
                            teamId: stat.teamId,
                            matchId,
                            tournamentId,
                            teamId_matchId: { teamId: stat.teamId, matchId },
                        },
                        create: {
                            teamId: stat.teamId,
                            matchId,
                            tournamentId,
                            seasonId,
                            position: stat.position,
                        },
                        update: { position: stat.position },
                        select: { id: true, teamId: true },
                    })
                );
                const teamStatsResults = await Promise.all(teamStatsPromises);

                // Build teamId -> teamStatsId map
                const teamStatsMap = new Map<string, string>();
                teamStatsResults.forEach((ts) => teamStatsMap.set(ts.teamId, ts.id));

                // STEP 2: Batch upsert all TeamPlayerStats
                const allPlayerOps: Array<{
                    playerId: string;
                    teamId: string;
                    teamStatsId: string;
                    kills: number;
                }> = [];

                stats.forEach((stat) => {
                    const teamStatsId = teamStatsMap.get(stat.teamId);
                    if (!teamStatsId) return;

                    stat.players.forEach((player) => {
                        allPlayerIds.add(player.playerId);
                        allPlayerOps.push({
                            playerId: player.playerId,
                            teamId: stat.teamId,
                            teamStatsId,
                            kills: player.kills ?? 0,
                        });
                    });
                });

                // Process in chunks of 20
                const CHUNK_SIZE = 20;
                for (let i = 0; i < allPlayerOps.length; i += CHUNK_SIZE) {
                    const chunk = allPlayerOps.slice(i, i + CHUNK_SIZE);
                    await Promise.all(
                        chunk.map((op) =>
                            tx.teamPlayerStats.upsert({
                                where: {
                                    playerId_teamId_matchId: {
                                        playerId: op.playerId,
                                        teamId: op.teamId,
                                        matchId,
                                    },
                                },
                                create: {
                                    playerId: op.playerId,
                                    teamId: op.teamId,
                                    matchId,
                                    seasonId: seasonId || "",
                                    teamStatsId: op.teamStatsId,
                                    kills: op.kills,
                                    deaths: 1,
                                },
                                update: {
                                    kills: op.kills,
                                    deaths: 1,
                                },
                            })
                        )
                    );
                }
            }

            // STEP 3: Batch recalculate PlayerStats for ALL affected players
            const playerArray = Array.from(allPlayerIds);
            const CHUNK_SIZE = 20;
            for (let i = 0; i < playerArray.length; i += CHUNK_SIZE) {
                const chunk = playerArray.slice(i, i + CHUNK_SIZE);
                await Promise.all(
                    chunk.map(async (playerId) => {
                        const allPlayerStats = await tx.teamPlayerStats.findMany({
                            where: {
                                playerId,
                                seasonId: seasonId || "",
                            },
                            select: {
                                kills: true,
                                matchId: true,
                            },
                        });

                        const totalKills = allPlayerStats.reduce(
                            (acc, curr) => acc + curr.kills,
                            0
                        );
                        const uniqueMatches = new Set(allPlayerStats.map((s) => s.matchId));
                        const totalDeaths = uniqueMatches.size;

                        await tx.playerStats.upsert({
                            where: {
                                seasonId_playerId: {
                                    playerId,
                                    seasonId: seasonId || "",
                                },
                            },
                            create: {
                                playerId,
                                seasonId: seasonId || "",
                                kills: totalKills,
                                deaths: totalDeaths,
                            },
                            update: {
                                kills: totalKills,
                                deaths: totalDeaths,
                            },
                        });
                    })
                );
            }
        }, {
            timeout: 45000, // 45 seconds for multi-match transaction
            maxWait: 5000,  // 5 seconds max wait to acquire connection
        });

        const duration = Date.now() - startTime;
        logger.log(`[TOURNAMENT_BULK] All ${matchCount} matches saved successfully in ${duration}ms`);

        return SuccessResponse({
            message: `All ${matchCount} matches saved successfully (${duration}ms)`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.log(`[TOURNAMENT_BULK] Error: ${errorMessage}`);

        if (errorMessage.includes("timeout") || errorMessage.includes("expired transaction") || errorMessage.includes("Transaction already closed")) {
            return ErrorResponse({
                message: "Database operation timed out - too many operations. Please try with fewer matches.",
                status: 500,
            });
        }

        return handleApiErrors(error);
    }
}
