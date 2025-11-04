import { getMatchById } from "@/src/services/match/getMatchById";
import { getPlayerById } from "@/src/services/player/getPlayerById";
import { getTeamById } from "@/src/services/team/getTeamById";
import { getTeamStats } from "@/src/services/team/getTeamStatsById";
import { updateTeamStats } from "@/src/services/team/updateTeamStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
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

    const body = teamStatsSchema
      .pick({ matchId: true })
      .parse(await req.json());

    const isMatchExist = await getMatchById({ where: { id: body.matchId } });

    if (!isMatchExist) {
      return ErrorResponse({
        message: "Match not found",
        status: 404,
      });
    }

    const team = await getTeamById({ where: { id: teamId } });

    if (!team) {
      return ErrorResponse({
        message: "Team not found",
        status: 404,
      });
    }

    const stats = await getTeamStats({
      where: { teamId: teamId, matchId: body.matchId },
    });

    if (!stats) {
      return ErrorResponse({
        message: "Stats not found",
        status: 404,
      });
    }

    const statsPlayer = stats.teamPlayerStats.map((player) => {
      return {
        playerId: player.playerId,
        name: player.player.user.userName,
        kills: player.kills,
        deaths: player.deaths,
        kd: player.kills / player.deaths || 0,
      };
    });

    const data = stats
      ? {
          id: stats.id,
          kills: stats.kills,
          deaths: stats.deaths,
          wins: stats.wins,
          kd: stats.kills / stats.deaths || 0,
          position: stats.position,
          players: statsPlayer,
        }
      : null;

    return SuccessResponse({
      data: data,
      message: "Team stats updated successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const teamId = (await params).id;
    const isTeamExist = await getTeamById({ where: { id: teamId } });
    if (!isTeamExist || !isTeamExist.seasonId) {
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
      tournamentId: isTeamExist?.tournamentId || "",
      data: body,
      seasonId: isTeamExist?.seasonId,
    });

    if (!stats) {
      return ErrorResponse({
        message: "Team stats not updated",
        status: 400,
      });
    }

    const teamStats = await getTeamStats({
      where: { teamId: teamId, matchId: body.matchId },
    });

    return SuccessResponse({ data: teamStats, message: "Team stats updated" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
