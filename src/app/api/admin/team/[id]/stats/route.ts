import { getMatchById } from "@/src/services/match/getMatchById";
import { getPlayerById } from "@/src/services/player/getPlayerById";
import { getTeamById } from "@/src/services/team/getTeamById";
import { getTeamStatsById } from "@/src/services/team/getTeamStatsById";
import { updateTeamStats } from "@/src/services/team/updateTeamStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const teamId = (await params).id;
    const isTeamExist = await getTeamById({ where: { id: teamId } });
    if (!isTeamExist) {
      return ErrorResponse({
        message: "Team not found",
        status: 404,
      });
    }
    const body = teamStatsSchema.parse(await req.json());

    const isMatchExist = await getMatchById({ where: { id: body.matchId } });

    if (!isMatchExist) {
      return ErrorResponse({
        message: "Match not found",
        status: 404,
      });
    }
    // check if all the player exist
    for (const player of body.players) {
      const isPlayerExist = await getPlayerById({ id: player.playerId });

      if (!isPlayerExist) {
        return ErrorResponse({
          message: "Player not found",
          status: 404,
        });
      }
    }
    const stats = await updateTeamStats({
      teamId: teamId,
      matchId: body.matchId,
      data: body,
    });
    if (!stats) {
      return ErrorResponse({
        message: "Team stats not updated",
        status: 400,
      });
    }
    const teamStats = await getTeamStatsById({
      where: { teamId },
      include: { playersStats: true },
    });

    return SuccessResponse({ data: teamStats, message: "Team stats updated" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
