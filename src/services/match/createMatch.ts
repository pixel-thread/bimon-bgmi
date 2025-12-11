import { prisma } from "@/src/lib/db/prisma";
import { logger } from "@/src/utils/logger";

type Props = {
  data: {
    tournamentId: string;
    seasonId: string;
  };
};

type CreateMatchResult = {
  id: string;
  teamsProcessed: number;
  playersProcessed: number;
  createdAt: Date;
};

// Process teams in batches to avoid connection pool exhaustion
const BATCH_SIZE = 5;

/**
 * Creates a match and processes all teams in batches for optimal performance.
 * Uses batch operations with timeouts to prevent hanging.
 */
export async function createMatch({ data }: Props): Promise<CreateMatchResult> {
  const startTime = Date.now();

  // Create match first
  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      seasonId: data.seasonId,
    },
  });

  logger.log(`Match created: ${match.id}`);

  // Fetch all teams for this tournament
  const teams = await prisma.team.findMany({
    where: { tournamentId: data.tournamentId },
    select: {
      id: true,
      players: { select: { id: true } },
    },
  });

  let teamsProcessed = 0;
  let playersProcessed = 0;

  // Process teams in batches to avoid overwhelming the database
  for (let i = 0; i < teams.length; i += BATCH_SIZE) {
    const batch = teams.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (team) => {
        try {
          await prisma.$transaction(
            async (tx) => {
              // Create TeamStats
              const teamStats = await tx.teamStats.create({
                data: {
                  teamId: team.id,
                  matchId: match.id,
                  seasonId: data.seasonId,
                  tournamentId: data.tournamentId,
                },
              });

              // Connect team to match
              await tx.team.update({
                where: { id: team.id },
                data: { matches: { connect: { id: match.id } } },
              });

              if (team.players && team.players.length > 0) {
                const playerIds = team.players.map((p) => p.id);

                // Bulk create teamPlayerStats, matchPlayerPlayed, and connect players in parallel
                await Promise.all([
                  tx.teamPlayerStats.createMany({
                    data: playerIds.map((playerId) => ({
                      teamId: team.id,
                      matchId: match.id,
                      seasonId: data.seasonId,
                      playerId,
                      teamStatsId: teamStats.id,
                      kills: 0,
                      deaths: 0, // Placeholder - actual stats counted when scoreboard is submitted
                    })),
                  }),
                  tx.matchPlayerPlayed.createMany({
                    data: playerIds.map((playerId) => ({
                      matchId: match.id,
                      playerId,
                      tournamentId: data.tournamentId,
                      seasonId: data.seasonId,
                      teamId: team.id,
                    })),
                  }),
                  // Process all player updates in parallel
                  ...playerIds.map((playerId) =>
                    tx.player.update({
                      where: { id: playerId },
                      data: { matches: { connect: { id: match.id } } },
                    })
                  ),
                  // Ensure PlayerStats exists for each player (no increment - stats counted on submission)
                  ...playerIds.map((playerId) =>
                    tx.playerStats.upsert({
                      where: {
                        seasonId_playerId: { playerId, seasonId: data.seasonId },
                      },
                      create: { playerId, seasonId: data.seasonId, kills: 0, deaths: 0 },
                      update: {}, // No increment here - deaths counted when player appears in scoreboard
                    })
                  ),
                ]);

                playersProcessed += playerIds.length;
              }

              teamsProcessed++;
            },
            {
              timeout: 30000, // 30 second timeout per team transaction
            }
          );
        } catch (error) {
          logger.error(`Failed to process team ${team.id}: ${error}`);
          // Continue processing other teams even if one fails
        }
      })
    );
  }

  const duration = Date.now() - startTime;
  logger.log(`Match creation completed in ${duration}ms. Teams: ${teamsProcessed}, Players: ${playersProcessed}`);

  return {
    id: match.id,
    teamsProcessed,
    playersProcessed,
    createdAt: match.createdAt,
  };
}
