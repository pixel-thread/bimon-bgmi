import { getAllTournament } from "@/src/services/tournament/getAllTournament";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse, CACHE_HEADERS } from "@/src/utils/next-response";

export async function GET(request: Request) {
  try {
    await tokenMiddleware(request);
    const tournaments = await getAllTournament();
    return SuccessResponse({
      data: tournaments,
      headers: CACHE_HEADERS.SHORT,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

