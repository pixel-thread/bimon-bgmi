import { getAllSeasons } from "@/src/services/season/getAllSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET() {
  try {
    const season = await getAllSeasons();
    return SuccessResponse({
      data: season,
      message: "Seasons fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
