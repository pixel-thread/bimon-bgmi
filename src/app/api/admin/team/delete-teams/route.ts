import { deleteTeamByTournamentId } from "@/src/services/team/deleteTeamsByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

import { deleteTeamSchema } from "@/src/utils/validation/team/delete-team-schema";

export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);
    const body = deleteTeamSchema.parse(await req.json());
    const isTeamExist = await getTournamentById({
      id: body.tournamentId,
    });

    if (!isTeamExist) {
      return ErrorResponse({
        message: "Tournament does not exist",
        status: 404,
      });
    }
    const deletedTeams = await deleteTeamByTournamentId({
      tournamentId: body.tournamentId,
    });

    return SuccessResponse({
      data: deletedTeams,
      message: "Teams deleted successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
