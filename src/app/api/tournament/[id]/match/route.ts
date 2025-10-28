import { getAllMatches } from "@/src/services/match/getAllMatches";
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
    const tournamentId = (await params).id;

    const isTournamentExist = await getTournamentById({ id: tournamentId });

    if (!isTournamentExist) {
      return ErrorResponse({ message: "Tournament not found", status: 404 });
    }

    const matches = await getAllMatches({ where: { tournamentId } });

    return SuccessResponse({ data: matches, message: "Success" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
