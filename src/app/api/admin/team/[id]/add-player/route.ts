import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerToTeam } from "@/src/services/team/addPlayerToTeam";
import { getTeamById } from "@/src/services/team/getTeamById";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { addPlayerSchema } from "@/src/utils/validation/team/add-player";
import { prisma } from "@/src/lib/db/prisma";
import { checkAndApplyAutoBan } from "@/src/services/player/autoBan";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);

    const teamId = (await params).id;

    const isTeamExist = await getTeamById({ where: { id: teamId } });

    if (!isTeamExist) {
      return ErrorResponse({
        message: "Team does not exist",
        status: 404,
      });
    }
    const body = addPlayerSchema.parse(await req.json());

    const isPlayerExist = await getPlayerById({ id: body.playerId });

    if (!isPlayerExist) {
      return ErrorResponse({
        message: "Player does not exist",
        status: 404,
      });
    }

    const [teams, _] = await getTeamByTournamentId({
      tournamentId: isTeamExist?.tournamentId || "",
      page: "all",
    });

    if (teams) {
      const isPlayerAlreadyOnTeam = teams.find((team) =>
        team.players.find((player) => player.id === body.playerId),
      );

      if (isPlayerAlreadyOnTeam) {
        return ErrorResponse({
          message: "Player already on a a team please remove player first",
          status: 400,
        });
      }
    }

    // Get tournament to check entry fee
    const tournament = await prisma.tournament.findUnique({
      where: { id: isTeamExist.tournamentId || "" },
      select: { id: true, name: true, fee: true },
    });

    const entryFee = tournament?.fee || 0;
    let message = "Player added to team successfully";

    // UC deduction if requested and entry fee exists
    if (body.deductUC && entryFee > 0) {
      const player = await prisma.player.findUnique({
        where: { id: body.playerId },
        select: { id: true, userId: true, uc: { select: { balance: true } } },
      });

      const currentBalance = player?.uc?.balance || 0;
      const newBalance = currentBalance - entryFee;

      await prisma.$transaction(async (tx) => {
        // Create transaction record
        await tx.transaction.create({
          data: {
            amount: entryFee,
            type: "debit",
            description: `Entry fee for ${tournament?.name}`,
            playerId: body.playerId,
          },
        });

        // Update UC balance
        await tx.uC.upsert({
          where: { playerId: body.playerId },
          create: {
            balance: newBalance,
            player: { connect: { id: body.playerId } },
            user: { connect: { id: player?.userId } },
          },
          update: { balance: newBalance },
        });

        // Check for auto-ban
        await checkAndApplyAutoBan(body.playerId, newBalance, tx);
      });

      message += `. ${entryFee} UC debited`;
    }

    const updatedTeam = await addPlayerToTeam({
      playerId: body.playerId,
      matchId: body.matchId,
      teamId,
    });

    return SuccessResponse({
      data: updatedTeam,
      message,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
