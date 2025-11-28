import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerToTeam } from "@/src/services/team/addPlayerToTeam";
import { getTeamById } from "@/src/services/team/getTeamById";
import { getTeamStats } from "@/src/services/team/getTeamStatsById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { addPlayerSchema } from "@/src/utils/validation/team/add-player";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
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

    const isPlayerAlreadyOnTeam = isPlayerExist?.teamId;

    if (isPlayerAlreadyOnTeam) {
      return ErrorResponse({
        message: "Player already on a a team please remove player first",
        status: 400,
      });
    }

    const updatedTeam = await addPlayerToTeam({
      playerId: body.playerId,
      matchId: body.matchId,
      teamId,
    });

    return SuccessResponse({
      data: updatedTeam,
      message: "Player added to team successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
