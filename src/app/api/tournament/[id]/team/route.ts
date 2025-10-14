import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);

    const id = (await params).id;

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teams = await getTeamByTournamentId({ tournamentId: id });

    return SuccessResponse({
      data: teams,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
