import { createMatch } from "@/src/services/match/createMatch";
import { getAllMatches } from "@/src/services/match/getAllMatches";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { matchSchema } from "@/src/utils/validation/match";

export async function GET(req: Request) {
  try {
    await superAdminMiddleware(req);
    const matches = await getAllMatches();
    return SuccessResponse({
      data: matches,
      message: "Success fetched all matches",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);

    const body = matchSchema.parse(await req.json());

    // Run validation in parallel for faster response
    const [isTournamentExist, activeSeason] = await Promise.all([
      getTournamentById({ id: body.tournamentId }),
      getActiveSeason(),
    ]);

    if (!isTournamentExist) {
      return ErrorResponse({ message: "Tournament not found", status: 404 });
    }

    if (activeSeason?.id !== body.seasonId) {
      return ErrorResponse({ message: "season is not active", status: 400 });
    }

    const createdMatch = await createMatch({
      data: body,
    });

    // Build informative message
    const message = "Match created successfully";

    return SuccessResponse({
      message,
      data: { id: createdMatch.id },
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
