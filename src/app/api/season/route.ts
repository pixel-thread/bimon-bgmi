import { getAllSeasons } from "@/src/services/season/getAllSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse, CACHE_HEADERS } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);
    const season = await getAllSeasons();
    return SuccessResponse({
      data: season,
      message: "Seasons fetched successfully",
      headers: CACHE_HEADERS.MEDIUM,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

