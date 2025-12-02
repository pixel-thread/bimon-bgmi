import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerToTeam } from "@/src/services/team/addPlayerToTeam";
import { getTeamById } from "@/src/services/team/getTeamById";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { addPlayerSchema } from "@/src/utils/validation/team/add-player";

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
