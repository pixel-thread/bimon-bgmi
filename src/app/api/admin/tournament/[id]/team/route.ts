import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { deleteTeamByTournamentId } from "@/src/services/team/deleteTeamsByTournamentId";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const team = req.nextUrl.searchParams.get("team") || `1`;
    const teamSize = parseInt(team);
    const id = (await params).id;
    const tournamentExist = await getTournamentById({ id });
    const isTeamCreated = await getTeamByTournamentId({ tournamentId: id });
    if (isTeamCreated.length > 0) {
      return ErrorResponse({
        message: "Teams already created for this tournament",
        status: 400,
      });
    }

    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    const teams = await createTeamsByPolls({
      groupSize: teamSize as 1 | 2 | 3 | 4,
      tournamentId: id,
      seasonId: tournamentExist?.seasonId,
      pollId: "",
    });

    return SuccessResponse({
      data: teams.map((team) => ({
        total: team.players.length,
        team: team.players.map((player) => {
          return {
            kd: player.playerStats?.kd,
            win: player.playerStats?.wins,
            name: player.id,
          };
        }),
      })),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);

    const id = (await params).id;

    const tournamentExist = await getTournamentById({ id });

    const isTeamCreated = await getTeamByTournamentId({ tournamentId: id });

    if (isTeamCreated.length === 0) {
      return ErrorResponse({
        message: "Teams not created for this tournament",
        status: 400,
      });
    }

    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    const deletedTeams = await deleteTeamByTournamentId({ tournamentId: id });

    return SuccessResponse({
      data: deletedTeams,
      message: "Teams deleted successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
