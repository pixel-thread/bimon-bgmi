import { getPlayerById } from "@/src/services/player/getPlayerById";
import { getTeamById } from "@/src/services/team/getTeamById";
import { removePlayerFromTeam } from "@/src/services/team/removePlayerFromTeam";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { addPlayerSchema } from "@/src/utils/validation/team/add-player";
import { prisma } from "@/src/lib/db/prisma";

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

    const isPlayerAlreadyOnTeam = isTeamExist.players.some(
      (player) => player.id === body.playerId,
    );

    if (!isPlayerAlreadyOnTeam) {
      return ErrorResponse({
        message: "Player is not on a team",
        status: 400,
      });
    }

    // Get tournament info for potential refund
    const tournament = await prisma.tournament.findUnique({
      where: { id: isTeamExist.tournamentId || "" },
      select: { name: true, fee: true },
    });

    const result = await removePlayerFromTeam({
      playerId: body.playerId,
      teamId,
      tournamentName: tournament?.name,
      entryFee: tournament?.fee || 0,
    });

    let message = "Player Removed from a team successfully";
    if (result.refundIssued) {
      message += `. ${result.refundAmount} UC refunded`;
    }

    return SuccessResponse({
      data: result,
      message,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

