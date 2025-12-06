import { prisma } from "@/src/lib/db/prisma";
import { addPlayersToTeamBatch } from "@/src/services/team/addPlayersToTeamBatch";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { createTeamSchema } from "@/src/utils/validation/team/create-team-schema";
import { NextRequest } from "next/server";
import { checkAndApplyAutoBan } from "@/src/services/player/autoBan";

/**
 * Process team players in background
 */
async function processTeamInBackground(
  teamId: string,
  matchId: string,
  playerIds: string[],
  seasonId: string,
  tournamentId: string
) {
  try {
    logger.log(`[BG] Starting team processing for team ${teamId}`);

    // Add all players to the team
    if (playerIds.length > 0) {
      await addPlayersToTeamBatch({
        teamId,
        matchId,
        playerIds,
        seasonId,
        tournamentId,
      });
    }

    // Set team status to READY
    await prisma.team.update({
      where: { id: teamId },
      data: { status: "READY" },
    });

    logger.log(`[BG] Completed team processing for team ${teamId}`);
  } catch (error) {
    logger.error(`[BG] Error processing team ${teamId}: ${error}`);
    // Try to set READY anyway so it doesn't stay stuck
    try {
      await prisma.team.update({
        where: { id: teamId },
        data: { status: "READY" },
      });
    } catch { /* ignore */ }
  }
}

export async function POST(req: NextRequest) {
  try {
    await superAdminMiddleware(req);
    const body = createTeamSchema.parse(await req.json());

    const playerIds = body.players.map((p) => p.playerId);

    // 1. Batch validate: tournament, match, and all players in parallel
    const [tournament, match, existingPlayers] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id: body.tournamentId },
        select: { id: true, name: true, fee: true, seasonId: true },
      }),
      prisma.match.findUnique({
        where: { id: body.matchId },
        select: { id: true },
      }),
      prisma.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, uc: { select: { balance: true } }, user: { select: { userName: true } } },
      }),
    ]);

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found", status: 404 });
    }

    if (!match) {
      return ErrorResponse({ message: "Match not found", status: 404 });
    }

    if (existingPlayers.length !== playerIds.length) {
      return ErrorResponse({
        message: "One or more players not found",
        status: 404,
      });
    }

    const entryFee = tournament.fee || 0;

    // 2. Check if any player is already on a team for this tournament (batch query)
    const existingTeamPlayers = await prisma.teamPlayerStats.findMany({
      where: {
        team: { tournamentId: body.tournamentId },
        playerId: { in: playerIds },
      },
      select: { playerId: true },
    });

    if (existingTeamPlayers.length > 0) {
      return ErrorResponse({
        message: "One or more players are already on a team. Please remove them first.",
        status: 400,
      });
    }

    // 3. Get current team count for team number
    const teamCount = await prisma.team.count({
      where: { tournamentId: body.tournamentId },
    });

    // Generate team name from player usernames
    // Sort existingPlayers to match the order of playerIds (user input order)
    const sortedPlayers = playerIds
      .map(id => existingPlayers.find(p => p.id === id))
      .filter((p): p is typeof existingPlayers[0] => !!p);

    const teamName = sortedPlayers
      .map((p) => p.user.userName)
      .join('_');

    // 4. Create team with PROCESSING status (instantly visible with orange dot)
    const team = await prisma.team.create({
      data: {
        name: teamName,
        teamNumber: teamCount + 1,
        status: "PROCESSING",
        tournament: { connect: { id: body.tournamentId } },
        matches: { connect: { id: body.matchId } },
        season: { connect: { id: tournament.seasonId || "" } },
      },
    });

    // 5. UC deduction MUST happen synchronously (before returning success)
    if (body.deductUC && entryFee > 0 && playerIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        const playerBalanceMap = new Map(
          existingPlayers.map((p) => [p.id, p.uc?.balance || 0])
        );

        await tx.transaction.createMany({
          data: playerIds.map((playerId) => ({
            amount: entryFee,
            type: "debit",
            description: `Entry fee for ${tournament.name}`,
            playerId,
          })),
        });

        for (const playerId of playerIds) {
          const currentBalance = playerBalanceMap.get(playerId) || 0;
          const newBalance = currentBalance - entryFee;

          await tx.uC.upsert({
            where: { playerId },
            create: {
              balance: newBalance,
              player: { connect: { id: playerId } },
              user: {
                connect: {
                  id: (
                    await tx.player.findUnique({
                      where: { id: playerId },
                      select: { userId: true },
                    })
                  )?.userId,
                },
              },
            },
            update: { balance: newBalance },
          });

          await checkAndApplyAutoBan(playerId, newBalance, tx);
        }
      });
    }

    // 6. Start background processing for adding players to team
    setImmediate(() => {
      processTeamInBackground(
        team.id,
        body.matchId,
        playerIds,
        tournament.seasonId || "",
        body.tournamentId
      );
    });

    let message = "Team created successfully";
    if (body.deductUC && entryFee > 0) {
      message += `. ${entryFee} UC debited from each player`;
    }

    return SuccessResponse({
      data: team,
      message,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
