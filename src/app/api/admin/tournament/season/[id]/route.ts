import { getTournamentBySeasonId } from "@/src/services/tournament/getTournamentBySeasonId";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;
    const tournaments = await getTournamentBySeasonId({ seasonId: id });
    return SuccessResponse({ data: tournaments });
  } catch (error) {
    return handleApiErrors(error);
  }
}
