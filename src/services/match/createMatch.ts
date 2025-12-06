import { prisma } from "@/src/lib/db/prisma";
import { logger } from "@/src/utils/logger";

type Props = {
  data: {
    tournamentId: string;
    seasonId: string;
  };
};

/**
 * Process a single team - extracted for reusability and retry logic
 */
async function processTeam(
  team: { id: string; players: { id: string }[] },
  matchId: string,
  seasonId: string,
  tournamentId: string
) {
  await prisma.$transaction(async (tx) => {
    // Create TeamStats
    const teamStats = await tx.teamStats.create({
      data: {
        teamId: team.id,
        matchId: matchId,
        seasonId: seasonId,
        tournamentId: tournamentId,
      },
    });

    // Connect team to match
    await tx.team.update({
      where: { id: team.id },
      data: { matches: { connect: { id: matchId } } },
    });

    if (team.players && team.players.length > 0) {
      const playerIds = team.players.map((p) => p.id);

      // Bulk create teamPlayerStats and matchPlayerPlayed in parallel
      await Promise.all([
        tx.teamPlayerStats.createMany({
          data: playerIds.map((playerId) => ({
            teamId: team.id,
            matchId: matchId,
            seasonId: seasonId,
            playerId,
            teamStatsId: teamStats.id,
            kills: 0,
            deaths: 1,
          })),
        }),
        tx.matchPlayerPlayed.createMany({
          data: playerIds.map((playerId) => ({
            matchId: matchId,
            playerId,
            tournamentId: tournamentId,
            seasonId: seasonId,
            teamId: team.id,
          })),
        }),
      ]);

      // Update players sequentially (to avoid connection pool exhaustion)
      for (const playerId of playerIds) {
        await tx.player.update({
          where: { id: playerId },
          data: { matches: { connect: { id: matchId } } },
        });
        await tx.playerStats.upsert({
          where: {
            seasonId_playerId: { playerId, seasonId: seasonId },
          },
          create: { playerId, seasonId: seasonId, kills: 0, deaths: 1 },
          update: { deaths: { increment: 1 } },
        });
      }
    }
  });
}

/**
 * Process teams and players in the background.
 * Handles large numbers of teams by processing in batches.
 */
async function processMatchInBackground(
  matchId: string,
  tournamentId: string,
  seasonId: string
) {
  const BATCH_SIZE = 5; // Process 5 teams in parallel at a time
  const MAX_RETRIES = 2;

  try {
    logger.log(`[BG] Starting background processing for match ${matchId}`);

    // Check if match still exists
    const matchExists = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!matchExists) {
      logger.log(`[BG] Match ${matchId} was deleted, skipping processing`);
      return;
    }

    // Fetch all teams
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      select: {
        id: true,
        players: { select: { id: true } },
      },
    });

    const totalTeams = teams.length;
    logger.log(`[BG] Found ${totalTeams} teams to process`);

    if (totalTeams === 0) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "READY" },
      });
      logger.log(`[BG] No teams to process, match ${matchId} is ready`);
      return;
    }

    let processedCount = 0;
    const failedTeams: { team: typeof teams[0]; error: string }[] = [];

    // Process in batches
    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      // Check if match still exists every batch
      const stillExists = await prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true },
      });

      if (!stillExists) {
        logger.log(`[BG] Match ${matchId} was deleted, stopping processing`);
        return;
      }

      const batch = teams.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map((team) => processTeam(team, matchId, seasonId, tournamentId))
      );

      // Track results
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          processedCount++;
        } else {
          failedTeams.push({ team: batch[idx], error: String(result.reason) });
        }
      });

      // Log progress
      const progress = Math.round((processedCount / totalTeams) * 100);
      logger.log(`[BG] Progress: ${processedCount}/${totalTeams} teams (${progress}%)`);
    }

    // Retry failed teams (once)
    if (failedTeams.length > 0 && MAX_RETRIES > 0) {
      logger.log(`[BG] Retrying ${failedTeams.length} failed teams...`);

      for (const { team } of failedTeams) {
        try {
          await processTeam(team, matchId, seasonId, tournamentId);
          processedCount++;
          logger.log(`[BG] Retry succeeded for team ${team.id}`);
        } catch (retryError) {
          logger.error(`[BG] Retry failed for team ${team.id}: ${retryError}`);
        }
      }
    }

    // Update match status to READY
    try {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "READY" },
      });
      logger.log(`[BG] Completed! Processed ${processedCount}/${totalTeams} teams for match ${matchId}`);
    } catch {
      logger.log(`[BG] Match ${matchId} was deleted during processing`);
    }
  } catch (error) {
    const errorMessage = String(error);
    if (errorMessage.includes("Foreign key") || errorMessage.includes("Record to update not found")) {
      logger.log(`[BG] Match ${matchId} was deleted, processing aborted`);
    } else {
      logger.error(`[BG] Error processing match ${matchId}: ${error}`);
      // Try to mark as READY anyway so it doesn't stay stuck
      try {
        await prisma.match.update({
          where: { id: matchId },
          data: { status: "READY" },
        });
      } catch { /* ignore */ }
    }
  }
}

/**
 * Creates a match instantly and processes teams/players in background.
 * Returns immediately after creating the match record (~100ms).
 * Heavy processing runs in background - by the time user opens bulk edit, it should be done.
 */
export async function createMatch({ data }: Props) {
  // Step 1: Create match immediately with PROCESSING status
  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      seasonId: data.seasonId,
      status: "PROCESSING", // Will be set to READY when background processing completes
    },
  });

  // Step 2: Start background processing (don't await - runs after response)
  // Using setImmediate/setTimeout(0) to ensure response is sent first
  setImmediate(() => {
    processMatchInBackground(match.id, data.tournamentId, data.seasonId);
  });

  // Step 3: Return match immediately - user sees instant response
  return match;
}

